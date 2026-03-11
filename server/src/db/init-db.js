import pool from "./pool.js";

export default async function initDb() {
  const sql = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- users
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text DEFAULT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      is_verified boolean NOT NULL DEFAULT false,
      token_version int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

    -- notes
    CREATE TABLE IF NOT EXISTS notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, created_at DESC);

    -- schools
    CREATE TABLE IF NOT EXISTS schools (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      addr text,
      contact_email text,
      contact_phone text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(lower(name));

    -- memberships
    CREATE TABLE IF NOT EXISTS memberships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (school_id, user_id)
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'memberships_role_check'
      ) THEN
        ALTER TABLE memberships
          ADD CONSTRAINT memberships_role_check CHECK (user_role IN ('admin','teacher','student'));
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_memberships_school ON memberships(school_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

    -- member requests
    CREATE TABLE IF NOT EXISTS member_req (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role text NOT NULL DEFAULT 'teacher',
      accepted boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (school_id, user_id)
    );
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'member_req_role_check'
      ) THEN
        ALTER TABLE member_req
          ADD CONSTRAINT member_req_role_check CHECK (user_role IN ('teacher','student'));
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_member_req_school ON member_req(school_id, accepted);

    -- programs
    CREATE TABLE IF NOT EXISTS programs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name text NOT NULL,
      descr text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_programs_school ON programs(school_id);
    CREATE INDEX IF NOT EXISTS idx_programs_school_name ON programs(school_id, lower(name));

    -- subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program_id, lower(name));

    -- program_subject meta
    CREATE TABLE IF NOT EXISTS program_subject (
      program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      year int NOT NULL DEFAULT 0,
      is_required boolean NOT NULL DEFAULT true,
      weekly_hours int NOT NULL DEFAULT 1 CHECK (weekly_hours > 0),
      weight int NOT NULL DEFAULT 1,
      PRIMARY KEY (program_id, subject_id)
    );
    CREATE INDEX IF NOT EXISTS idx_progsub_program ON program_subject(program_id, year, is_required);

    -- school years
    CREATE TABLE IF NOT EXISTS school_years (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name text NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_school_years_school ON school_years(school_id, start_date);

    -- periods
    CREATE TABLE IF NOT EXISTS periods (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
      start_time time NOT NULL,
      end_time time NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (end_time > start_time)
    );
    CREATE INDEX IF NOT EXISTS idx_periods_year ON periods(school_year_id, start_time);

    -- ===== NEW: classrooms / classes / enrollments / projects =====

    -- classrooms (aka groups) per school
    -- classrooms (aka groups) per school
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- UNIQ pe (school_id, lower(name)) se face cu INDEX, nu cu UNIQUE constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_classrooms_school_lower_name
  ON classrooms (school_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_classrooms_school
  ON classrooms(school_id, lower(name));

    -- student_classroom: membership of students in classrooms
    CREATE TABLE IF NOT EXISTS student_classroom (
      student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      PRIMARY KEY (student_id, classroom_id)
    );
    CREATE INDEX IF NOT EXISTS idx_studclass_classroom ON student_classroom(classroom_id);

    -- classes: an instance of a subject taught by a teacher (optionally bound to a classroom and periods)
    CREATE TABLE IF NOT EXISTS classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      start_period_id uuid NULL REFERENCES periods(id) ON DELETE SET NULL,
      end_period_id uuid NULL REFERENCES periods(id) ON DELETE SET NULL,
      classroom_id uuid NULL REFERENCES classrooms(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
    CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_classes_classroom ON classes(classroom_id);

    -- student enrollment to a class, with a score
    CREATE TABLE IF NOT EXISTS stud_classes (
      student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      class_score int NOT NULL DEFAULT 0 CHECK (class_score >= 0),
      PRIMARY KEY (student_id, class_id)
    );
    CREATE INDEX IF NOT EXISTS idx_studclasses_class ON stud_classes(class_id);

    -- projects owned by a teacher, optionally tied to a class
    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      class_id uuid NULL REFERENCES classes(id) ON DELETE CASCADE,
      name text NOT NULL,
      owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_projects_class ON projects(class_id);

    -- branches: participation of users in a project
    CREATE TABLE IF NOT EXISTS branches (
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      active boolean NOT NULL DEFAULT true,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_branches_user ON branches(user_id);




    --------------------------------------------------------------
    --------------------------------------------------------------
    --------------------------------------------------------------
    --------------------------------------------------------------
    --------------------------------------------------------------
    --------------------------------------------------------------
    --------------------------------------------------------------
    -- Enums
    DO $$ BEGIN
      CREATE TYPE node_owner_decision AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE node_review_verdict AS ENUM ('CREATED', 'POSITIVE', 'NEGATIVE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TYPE node_review_verdict ADD VALUE IF NOT EXISTS 'CREATED';

    -- Nodes
    CREATE TABLE IF NOT EXISTS nodes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label text NOT NULL,

      creator_id uuid NOT NULL REFERENCES users(id),
      owner_decision node_owner_decision NOT NULL DEFAULT 'PENDING',

      deleted_at timestamptz NULL,
      deleted_by uuid NULL REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_project_owner_decision ON nodes(project_id, owner_decision);
    CREATE INDEX IF NOT EXISTS idx_nodes_creator_id ON nodes(creator_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_not_deleted ON nodes(project_id) WHERE deleted_at IS NULL;

    -- Node reviews (guest↔guest)
    CREATE TABLE IF NOT EXISTS node_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      reviewer_id uuid NOT NULL REFERENCES users(id),
      verdict node_review_verdict NOT NULL
    );

    -- one review per reviewer per node
    CREATE UNIQUE INDEX IF NOT EXISTS ux_node_reviews_node_reviewer ON node_reviews(node_id, reviewer_id);

    -- query helpers
    CREATE INDEX IF NOT EXISTS idx_node_reviews_node ON node_reviews(node_id);
    CREATE INDEX IF NOT EXISTS idx_node_reviews_reviewer ON node_reviews(reviewer_id);

    -- Enforcement: reviews allowed only if node is PENDING, not deleted,
    -- and NOT on nodes created by the project owner.
    -- Assumes: projects has column owner_id uuid REFERENCES users(id)

    CREATE OR REPLACE FUNCTION trg_node_reviews_guard()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_owner_decision node_owner_decision;
      v_deleted_at timestamptz;
      v_node_creator_id uuid;
      v_project_owner_id uuid;
    BEGIN
      SELECT n.owner_decision, n.deleted_at, n.creator_id, p.owner_id
        INTO v_owner_decision, v_deleted_at, v_node_creator_id, v_project_owner_id
      FROM nodes n
      JOIN projects p ON p.id = n.project_id
      WHERE n.id = NEW.node_id;

      IF v_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot review a deleted node';
      END IF;

      -- Special case: CREATED review is an auto/audit entry by the creator
      IF NEW.verdict = 'CREATED' THEN
        IF NEW.reviewer_id <> v_node_creator_id THEN
          RAISE EXCEPTION 'CREATED verdict must be authored by the node creator';
        END IF;
        RETURN NEW;
      END IF;

      -- Normal reviews (POSITIVE / NEGATIVE) rules
      IF v_owner_decision <> 'PENDING' THEN
        RAISE EXCEPTION 'Cannot review a node once ownerDecision is %', v_owner_decision;
      END IF;

      IF v_node_creator_id = v_project_owner_id THEN
        RAISE EXCEPTION 'Guests cannot review nodes created by the project owner';
      END IF;

      IF NEW.reviewer_id = v_node_creator_id THEN
        RAISE EXCEPTION 'Cannot review your own node';
      END IF;

      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS node_reviews_guard_insupd ON node_reviews;
    CREATE TRIGGER node_reviews_guard_insupd
    BEFORE INSERT OR UPDATE ON node_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trg_node_reviews_guard();

    -- ==========================================================
    -- EDGES
    -- ==========================================================

    -- Edges
    CREATE TABLE IF NOT EXISTS edges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

      source_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      target_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,

      creator_id uuid NOT NULL REFERENCES users(id),
      owner_decision node_owner_decision NOT NULL DEFAULT 'PENDING',

      deleted_at timestamptz NULL,
      deleted_by uuid NULL REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_edges_project ON edges(project_id);
    CREATE INDEX IF NOT EXISTS idx_edges_project_owner_decision ON edges(project_id, owner_decision);
    CREATE INDEX IF NOT EXISTS idx_edges_creator_id ON edges(creator_id);
    CREATE INDEX IF NOT EXISTS idx_edges_not_deleted ON edges(project_id) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
    CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);

    -- Optional: prevent duplicates (same directed connection)
    CREATE UNIQUE INDEX IF NOT EXISTS ux_edges_project_source_target
    ON edges(project_id, source_id, target_id)
    WHERE deleted_at IS NULL;

    -- Edge reviews
    CREATE TABLE IF NOT EXISTS edge_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      edge_id uuid NOT NULL REFERENCES edges(id) ON DELETE CASCADE,
      reviewer_id uuid NOT NULL REFERENCES users(id),
      verdict node_review_verdict NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS ux_edge_reviews_edge_reviewer ON edge_reviews(edge_id, reviewer_id);
    CREATE INDEX IF NOT EXISTS idx_edge_reviews_edge ON edge_reviews(edge_id);
    CREATE INDEX IF NOT EXISTS idx_edge_reviews_reviewer ON edge_reviews(reviewer_id);

    -- Enforcement: reviews allowed only if edge is PENDING, not deleted,
    -- and NOT on edges created by the project owner.
    CREATE OR REPLACE FUNCTION trg_edge_reviews_guard()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_owner_decision node_owner_decision;
      v_deleted_at timestamptz;
      v_edge_creator_id uuid;
      v_project_owner_id uuid;
    BEGIN
      SELECT e.owner_decision, e.deleted_at, e.creator_id, p.owner_id
        INTO v_owner_decision, v_deleted_at, v_edge_creator_id, v_project_owner_id
      FROM edges e
      JOIN projects p ON p.id = e.project_id
      WHERE e.id = NEW.edge_id;

      IF v_deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot review a deleted edge';
      END IF;

      -- Special case: CREATED review is an auto/audit entry by the creator
      IF NEW.verdict = 'CREATED' THEN
        IF NEW.reviewer_id <> v_edge_creator_id THEN
          RAISE EXCEPTION 'CREATED verdict must be authored by the edge creator';
        END IF;
        RETURN NEW;
      END IF;

      IF v_owner_decision <> 'PENDING' THEN
        RAISE EXCEPTION 'Cannot review an edge once ownerDecision is %', v_owner_decision;
      END IF;

      IF v_edge_creator_id = v_project_owner_id THEN
        RAISE EXCEPTION 'Guests cannot review edges created by the project owner';
      END IF;

      IF NEW.reviewer_id = v_edge_creator_id THEN
        RAISE EXCEPTION 'Cannot review your own edge';
      END IF;

      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS edge_reviews_guard_insupd ON edge_reviews;
    CREATE TRIGGER edge_reviews_guard_insupd
    BEFORE INSERT OR UPDATE ON edge_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trg_edge_reviews_guard();



    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'v1verdict') THEN
        CREATE TYPE v1verdict AS ENUM (
          'ENDORSE',
          'OPPOSE',
          'CREATE',
          'DELETE',
          'POSTPONE'
        );
      END IF;
    END$$;

    -- ---------------------
    -- ---------------------
    -- Nodes
    -- ---------------------
    -- ---------------------
    CREATE TABLE IF NOT EXISTS v1nodes (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label      TEXT NOT NULL,

      CONSTRAINT v1nodes_project_label_unique
        UNIQUE (project_id, label)
    );

    CREATE TABLE IF NOT EXISTS v1nodereviews (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      node_id       UUID NOT NULL REFERENCES v1nodes(id) ON DELETE CASCADE,
      reviewer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      verdict       v1verdict NOT NULL
    );
    
    
    CREATE TABLE IF NOT EXISTS v1edges (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      source_id       UUID NOT NULL REFERENCES v1nodes(id) ON DELETE CASCADE,
      target_id       UUID NOT NULL REFERENCES v1nodes(id) ON DELETE CASCADE,

      CONSTRAINT v1edges_project_source_target_unique
        UNIQUE (project_id, source_id, target_id)
    );
      
      CREATE TABLE IF NOT EXISTS v1edgereviews (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        edge_id       UUID NOT NULL REFERENCES v1edges(id) ON DELETE CASCADE,
        reviewer_id   UUID NOT NULL REFERENCES users(id),
        verdict       v1verdict NOT NULL
      );
        
        CREATE UNIQUE INDEX IF NOT EXISTS v1nodereviews_one_create_per_user
        ON v1nodereviews (node_id, reviewer_id)
        WHERE verdict = 'CREATE';


  `;

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock($1)", [20250927]);
    await c.query(sql);
    await c.query("COMMIT");
    console.log("[db] init OK");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("[db] init FAILED", e.message);
    throw e;
  } finally {
    c.release();
  }
}
