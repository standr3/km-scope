import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOverviewApi, acceptRequestApi, revokeMemberApi } from '../api/admin';
import { Loader, CircleCheck } from 'lucide-react';
import Badge from '../components/ui/Badge/Badge';
import Button from '../components/ui/Button/Button';
import TeachersTable from '../features/teachers/TeachersTable/TeachersTable';
import TeacherRequestsList from '../features/teachers/TeacherRequestsList/TeacherRequestsList';
import TeacherRequestsTable from '../features/teachers/TeacherRequestsTable/TeacherRequestsTable';
import PageSection from '../components/layout/PageSection/PageSection';

import TableFilters from '../components/ui/TableFilters/TableFilters';
import FilterChipRadio from '../components/ui/FilterChipRadio/FilterChipRadio';
import SortDropdown from '../components/ui/SortDropdown/SortDropdown';
import TablePagination from '../components/ui/TablePagination/TablePagination';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card/Card';


import "./admin-teachers.css";
export default function AdminTeachers() {
  const [sortBy, setSort] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const handlePageChange = (v) => {
    console.log("changed to ", v)
    setPage(v);
  }
  const handleSortChange = (value) => {
    if (value === sortBy) {
      setSortAsc(!sortAsc);
    } else {
      setSortAsc(true);
      setSort(value);
    }
  }




  const qc = useQueryClient();
  const ovQ = useQuery({ queryKey: ['adminOverview'], queryFn: adminOverviewApi, retry: false });

  const acceptM = useMutation({ mutationFn: acceptRequestApi, onSuccess: () => qc.invalidateQueries({ queryKey: ['adminOverview'] }) });
  const revokeM = useMutation({ mutationFn: revokeMemberApi, onSuccess: () => qc.invalidateQueries({ queryKey: ['adminOverview'] }) });

  if (ovQ.isLoading) return <p>Loading…</p>;
  if (ovQ.isError) return <p>Error</p>;

  const { schools, teachers, requests_teachers } = ovQ.data;



  // console.log(requests_teachers)
  console.log("req", teachers)

  const requests_teachers_dummy = [
    {
      accepted: false,
      email: "alex.popescu@example.com",
      name: "Alex Popescu",
      request_id: "11111111-1111-4111-8111-111111111111",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0001-4000-8000-000000000001",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "maria.ionescu@example.com",
      name: "Maria Ionescu",
      request_id: "22222222-2222-4222-8222-222222222222",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0002-4000-8000-000000000002",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "dan.vasilescu@example.com",
      name: "Dan Vasilescu",
      request_id: "33333333-3333-4333-8333-333333333333",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0003-4000-8000-000000000003",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "elena.marin@example.com",
      name: "Elena Marin",
      request_id: "44444444-4444-4444-8444-444444444444",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0004-4000-8000-000000000004",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "andrei.dumitru@example.com",
      name: "Andrei Dumitru",
      request_id: "55555555-5555-4555-8555-555555555555",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0005-4000-8000-000000000005",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "ioana.georgescu@example.com",
      name: "Ioana Georgescu",
      request_id: "66666666-6666-4666-8666-666666666666",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0006-4000-8000-000000000006",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "mihai.stan@example.com",
      name: "Mihai Stan",
      request_id: "77777777-7777-4777-8777-777777777777",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0007-4000-8000-000000000007",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "ana.popa@example.com",
      name: "Ana Popa",
      request_id: "88888888-8888-4888-8888-888888888888",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0008-4000-8000-000000000008",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "cristian.enache@example.com",
      name: "Cristian Enache",
      request_id: "99999999-9999-4999-8999-999999999999",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0009-4000-8000-000000000009",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "laura.moldovan@example.com",
      name: "Laura Moldovan",
      request_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0010-4000-8000-000000000010",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "bogdan.rusu@example.com",
      name: "Bogdan Rusu",
      request_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0011-4000-8000-000000000011",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "simona.ilie@example.com",
      name: "Simona Ilie",
      request_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0012-4000-8000-000000000012",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "raul.neagu@example.com",
      name: "Raul Neagu",
      request_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0013-4000-8000-000000000013",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "diana.badea@example.com",
      name: "Diana Badea",
      request_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0014-4000-8000-000000000014",
      user_role: "teacher",
    },
    {
      accepted: false,
      email: "tudor.lazar@example.com",
      name: "Tudor Lazar",
      request_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      school_id: "77eeb986-6a79-48d4-b50b-da98be5ba25c",
      user_id: "a1b2c3d4-0015-4000-8000-000000000015",
      user_role: "teacher",
    },
  ];

  const allRows = [
    ...teachers.map((t) => ({
      ...t,
      __status: "granted",
      __key: `g:${t.membership_id}`,
    })),
    ...requests_teachers_dummy.map((t) => ({
      ...t,
      __status: "pending",
      __key: `p:${t.request_id}`,
    })),
  ];



  const filteredRows = allRows
    // status filter
    .filter((row) => {
      if (filter === "all") return true;
      return row.__status === filter;
    })

    // search filter
    .filter((row) => {
      if (!search.trim()) return true;

      const q = search.toLowerCase();

      return (
        row.name?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q)
      );
    });

  const rows = filteredRows

    .sort((a, b) => {
      if (!sortBy) return 0;

      const aVal = (a[sortBy] ?? "").toString().toLowerCase();
      const bVal = (b[sortBy] ?? "").toString().toLowerCase();

      const result = aVal.localeCompare(bVal);
      return !sortAsc ? -result : result;
    })
    .slice((page - 1) * pageSize, page * pageSize);

  const rowCount = filteredRows.length;

  console.log("rows", rows)

  return (
    <div className='page-container' >
      <header className='page-header'>
        Teacher Accounts
      </header>
      <main className='page-content'>


        <section className='page-section'>

          <div className="card-row">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <span className="card-value">{requests_teachers_dummy.length}</span>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Granted Requests</CardTitle>
                <span className="card-value">{teachers.length}</span>
              </CardHeader>
            </Card>
          </div>



        </section>

        {/*
         <PageSection>
          <div className="teachers-dashboard">
            
            <div className="teachers-dashboard__top">
              
              <div className="teachers-dashboard__kpis">
                <Card className="kpi kpi--total">
                  <CardHeader>
                    <CardTitle>Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="kpi__value">{teachers.length}</div>
                    <div className="kpi__meta">teachers</div>
                  </CardContent>
                </Card>

                <Card className="kpi kpi--pending">
                  <CardHeader>
                    <CardTitle>Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="kpi__value">{requests_teachers_dummy.length}</div>
                    <div className="kpi__meta">requests</div>
                  </CardContent>
                </Card>
                <div className="kpi-action">
                  <Button
                    className="kpi-action__button"
                    onClick={null}
                    disabled={false}
                  >
                    Accept all
                  </Button>
                </div>
              </div>

              <div className="teachers-dashboard__queue">
                <TeacherRequestsList
                  requests={requests_teachers_dummy}
                // onGrant={(id) => acceptM.mutate(id)}
                />
              </div>
            </div>
          </div>
        </PageSection> */}

        {/* <PageSection>
          <TeacherRequestsList
            requests={requests_teachers_dummy}
          // onGrant={(id) => acceptM.mutate(id)}
          />
        </PageSection> */}

        {/* <div className='table-wrapper'>
            <div className="table-container">
              <table>
                <thead className='table-header'>
                  <tr className='table-row'>
                    <th className='table-head'>Name</th>
                    <th className='table-head'>Email</th>
                    <th className='table-head'>Admission</th>
                    <th className='table-head'></th>

                  </tr>
                </thead>
                <tbody>

                  {requests_teachers.length > 0 && requests_teachers.map(r => (
                    <tr className='table-row' key={r.request_id}>
                      <td className='table-cell'>
                        {r.name}
                      </td>
                      <td className='table-cell'>
                        {r.email}
                      </td>
                      <td className='table-cell'>


                        <Badge>
                          <Loader />
                          Pending
                        </Badge>
                      </td>
                      <td className='table-cell'>
                        <Button onClick={() => acceptM.mutate(r.request_id)}>
                          Grant
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {teachers.length > 0 && teachers.map(t => (
                    <tr className='table-row' key={t.membership_id}>
                      <td className='table-cell'>
                        {t.name}
                      </td>
                      <td className='table-cell'>
                        {t.email}
                      </td>
                      <td className='table-cell'>

                        <span className='badge'>

                          <CircleCheck fill='hsl(145, 100%, 39%)' stroke='white' />
                          Granted
                        </span>
                      </td>
                      <td className='table-cell'>
                        <Button onClick={() => revokeM.mutate(t.membership_id)}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))
                  }



                </tbody>
              </table>
            </div>
          </div> */}


        <PageSection>
          {/* Row 2 */}
          <div className="teachers-dashboard__table">
            <div className="table-toolbar">
              {/* <div className="table-filters">
                <Button variant='filter-chip' className="filter-chip filter-chip--active">All</Button>
                <Button variant='filter-chip' className="filter-chip">Pending</Button>
                <Button variant='filter-chip' className="filter-chip">Accepted</Button>
              </div> */}

              <TableFilters aria-label="Report filters">
                <FilterChipRadio
                  name="report-filter"
                  value="all"
                  checked={filter === "all"}
                  onChange={setFilter}
                >
                  All
                </FilterChipRadio>

                <FilterChipRadio
                  name="report-filter"
                  value="pending"
                  checked={filter === "pending"}
                  onChange={setFilter}
                >
                  Pending
                </FilterChipRadio>

                <FilterChipRadio
                  name="report-filter"
                  value="granted"
                  checked={filter === "granted"}
                  onChange={setFilter}
                >
                  Granted
                </FilterChipRadio>


              </TableFilters>
              <input
                className="table-search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // reset la prima pagină
                }}
                style={{ outline: "none" }}
              />


              <SortDropdown
                label="Sort"
                value={sortBy}
                onChange={handleSortChange}
                options={[
                  { value: "name", label: "Name" },
                  { value: "email", label: "Email" },
                ]}
              />
              {/* <select className="table-sort" defaultValue="name">
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="status">Sort: Status</option>
              </select> */}
            </div>

            <TeachersTable
              // teachers={filter !== "pending" ? teachers : []}
              // pending={filter !== "granted" ? requests_teachers_dummy : []}
              onGrant={(id) => acceptM.mutate(id)}
              onRevoke={(id) => revokeM.mutate(id)}
              PendingIcon={Loader}
              GrantedIcon={(props) => (
                <CircleCheck fill="hsl(145, 100%, 39%)" stroke="white" {...props} />
              )}
              pageSize={pageSize}
              rows={rows}
            />
            {/* <div className="table-pagination">
              <div className="table-pagination__meta">Showing 1–10 of tC</div>
              <div className="table-pagination__controls">
                <Button>Prev</Button>
                <Button>Next</Button>
              </div>
            </div> */}

            <TablePagination

              page={page}
              pageCount={Math.max(1, Math.ceil(rowCount / pageSize))}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(n) => {
                // setPageSize(n);
                // setPage(1);
              }}
            />
          </div>
        </PageSection>

        {/* <ul>{schools.map(s => <li key={s.id}><b>{s.name}</b></li>)}</ul> */}

        {/*
         <section >
          <h3>Pending teacher requests</h3>
          <ul>
            {requests_teachers.map(r => (
              <li key={r.request_id} >
                <span>{r.email} → school {r.school_id}</span>
                <button onClick={() => acceptM.mutate(r.request_id)}>Accept</button>
              </li>
            ))}
            {!requests_teachers.length && <i>No pending</i>}
          </ul>
        </section>
        <section >
          <h3>Teachers</h3>
          <ul>
            {teachers.map(m => (
              <li key={m.membership_id} style={{ display: 'flex', gap: 8 }}>
                <span>{m.email} (school {m.school_id})</span>
                <button onClick={() => revokeM.mutate(m.membership_id)}>Revoke</button>
              </li>
            ))}
            {!teachers.length && <i>No teachers</i>}
          </ul>
        </section> 
        */}
      </main>

    </div>
  );
}
