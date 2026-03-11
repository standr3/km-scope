import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listSchoolsApi } from '../api/schools';
import { useNavigate } from 'react-router-dom';

export default function SignupMember() {
  const { registerMember, refetchAuth } = useAuth();
  const nav = useNavigate();
  const [schools, setSchools] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', school_id: '', role: 'teacher' });

  useEffect(() => { (async () => { setSchools(await listSchoolsApi()); })(); }, []);
  const on = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  console.log(schools)
  console.log(f)
  const disabled = !schools.length || !f.name || !f.email || !f.password || !f.school_id || !f.role;

  async function onSubmit(e) {
    e.preventDefault();
    await registerMember(f);
    await refetchAuth();
    location.assign('/dashboard/notes');
  }

  return (
    <div>

      <div className="card-wrapper">

        <div className="card-container">

          <div className="card">

            <div className="card-header">
              <div className="card-title">Register an account</div>
              <div className="card-description">Enter your information below to create your account
              </div>
            </div>

            <div className='card-content'>
              <form >
                <div className="field-group">


                  <div className="form-field">
                    <span className='field-label'>
                      Name
                    </span>
                    <div className="field-group-input">

                      <input className='form-input' required type="text" placeholder='First name' />
                      <input className='form-input' required type="text" placeholder='Last name' />
                    </div>
                  </div>

                  <div className="form-field">
                    <span className='field-label'>
                      Email
                    </span>
                    <input className='form-input' required type="email" placeholder='Email' />
                  </div>

                  <div className="form-field">
                    <span className='field-label'>
                      Password
                    </span>
                    <input className='form-input' required type="password" placeholder='&#9679;&#9679;&#9679;&#9679;' />
                    <p className='field-description'>Must be at least 4 characters long.</p>
                  </div>
                  <div className="form-field">
                    <span className='field-label'>
                      Confrm Password
                    </span>
                    <input className='form-input' required type="password" placeholder='&#9679;&#9679;&#9679;&#9679;' />
                    <p className='field-description'>Please confirm your password.</p>
                  </div>

                  <div className="form-field">
                    <button className="form-button">
                      Sign up
                    </button>
                    <p className='field-description form-redirect'>Already have an account?&nbsp;<a href="#">Sign in</a></p>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div>
        old
        <div style={{ maxWidth: 600, margin: '32px auto', display: 'grid', gap: 16 }}>
          <h2>Register as member</h2>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
            <div>
              <label>
                <input type="radio" name="role" value="teacher" checked={f.role === 'teacher'} onChange={on('role')} />
                Teacher
              </label>{' '}
              <label>
                <input type="radio" name="role" value="student" checked={f.role === 'student'} onChange={on('role')} />
                Student
              </label>
            </div>
            <input placeholder="Name" value={f.name} onChange={on('name')} required />
            <input placeholder="Email" value={f.email} onChange={on('email')} required />
            <input placeholder="Password" type="password" value={f.password} onChange={on('password')} required />
            <select value={f.school_id} onChange={on('school_id')}>
              <option value="">Select a school</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" disabled={disabled}>Sign up</button>
            {!schools.length && <small>No schools available. Ask an admin to register a school first.</small>}
          </form>
        </div>
      </div>
    </div>

  );
}