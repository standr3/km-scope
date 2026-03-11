import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useMatches } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KmLogo from './KmLogo';
import { GraduationCap, HatGlasses, EllipsisVertical, SquareUser, LogOut, BookOpen, Database, FileText, Wand2 } from 'lucide-react';

import './dashboard-layout.css'

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const linkStyle = ({ isActive }) => ({
  display: 'block', padding: '8px 12px', borderRadius: 6,
  background: isActive ? '#eef' : 'transparent', textDecoration: 'none', color: '#000'
});

export default function DashboardLayout() {



  const matches = useMatches();

  const header =
    matches
      .map((m) => m.handle?.header)
      .filter(Boolean)
      .pop() || "Dashboard";

  const [userBtnTriggered, setUserBtnTriggered] = useState(false);
  const rootRef = useRef(null);

  const { user, roles, logout, loggingOut } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTeacher = roles.includes('teacher');
  const [popperShow, setPopperShow] = useState(false);
  const togglePopperShow = () => {
    setPopperShow((prev) => !prev);

  }

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!userBtnTriggered) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setUserBtnTriggered(false);
      }
    }

    function onKeyDown(e) {
      if (!userBtnTriggered) return;
      if (e.key === "Escape") setUserBtnTriggered(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userBtnTriggered]);


  const sidebarContent = isAdmin ? (
    <div className='side-group' >
      <span className="side-group-label">
        Accounts
      </span>
      <div className='side-menu'>
        <NavLink className='side-menu-button' to='/dashboard/admin/teachers' >
          <HatGlasses width={16} height={16} />
          Teachers
        </NavLink>
        <NavLink className='side-menu-button' to='/dashboard/admin/students' >
          <GraduationCap width={16} height={16} />
          Students
        </NavLink>
      </div>

    </div>

  ) : (<span>empty</span>)

  const sidebarElement = (
    <aside className='sidebar'>
      <header className='side-header'>
        <a href='#'>

          <span className='logo-km'>KM</span>
          <span className='logo-scope'>Scope</span>
        </a>
      </header>
      <nav className='side-content'>
        {sidebarContent}
      </nav>

      <footer ref={rootRef} className='side-footer'>

        <button
          className="side-user-btn"
          onClick={() => setUserBtnTriggered((v) => !v)}
        >
          <div className="side-user">

            <SquareUser width={32} height={32} />
            <div>
              <span>{user?.name || user.email}</span>
              <span>{user.email}@email.com</span>
            </div>
          </div>

          <EllipsisVertical width={16} height={16} />
        </button>

        {userBtnTriggered && (
          <div className="popover-menu" >
            <button className="popover-item" >
              Account
            </button>

            <div className="sep" />

            <button className="popover-item popover-item--danger">
              Log out
            </button>
          </div>
        )}
        {/* <ul className="side-menu">

            <li className="side-menu-item">
              <button className="dropdown-menu-trigger" onClick={togglePopperShow}>
                <span className="avatar">
                  <SquareUser width={32} height={32} />
                </span>
                <div>
                  <span>{user?.name || user.email}</span>
                  <span>{user.email}@email.com</span>
                </div>
                <EllipsisVertical width={16} height={16} />
              </button>
            </li>
          </ul> */}
      </footer>
    </aside>

  )


  // return (


  //   <div className='dashboard-container' >
  //     {sidebarElement}

  //     <Outlet />

  //   </div >


  // );


  return (
    <SidebarProvider>
      <div className="dashboard-container">
        <Sidebar>
          <SidebarHeader className="gap-2">
            <div className="flex items-center gap-2 px-2">
              <div className="grid h-8 w-10 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
                KMS
              </div>
              <div className="leading-tight">
                <div className="font-semibold">KMScope</div>
                <div className="text-xs text-muted-foreground">Admin Dashboard</div>
              </div>
            </div>
            <Separator />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Accounts</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to='/dashboard/admin/teachers' >
                        <HatGlasses className="h-4 w-4" />
                        <span>Teachers</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to='/dashboard/admin/students' >
                        <GraduationCap className="h-4 w-4" />
                        <span>Students</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>


                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>


          </SidebarContent>

          <SidebarFooter>
            <Separator className="mb-2" />
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="" />
                <AvatarFallback>AN</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">andrei</div>
                <div className="truncate text-xs text-muted-foreground">
                  m@example.com
                </div>
              </div>

              <span className="text-muted-foreground">⋮</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* zona din dreapta */}
        <SidebarInset className="flex-1 min-w-0">
          <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">{header}</div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

{/* < div className = 'sidebar-container' >


      <aside className='sidebar' style={{ background: "transparent", color: "#F5F7F7" }}>
        <div className='sidebar-header'>
          <a href='#'>


            <span >
              <KmLogo
                width='24'
                height='24'
              />
              {isAdmin ? 'Admin' : 'Member'} {user ? `<${user.email}>` : ''}
            </span>
          </a>

        </div>

        {isAdmin ? (
          <nav className='sidebar-content' >


            <div className='sidebar-group' >
              <div className="sidebar-group-label">
                Accounts
              </div>
              <ul className='sidebar-menu'>
                <li className='sidebar-menu-item' >
                  <HatGlasses width={16} height={16} />
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/teachers' >Teachers</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <GraduationCap width={16} height={16} />
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/students' >Students</NavLink>
                </li>
              </ul>

            </div>
            <div className='sidebar-group'>
              <ul className='sidebar-menu'>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/programs' >Programs</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/subjects' >Subjects</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/school-years' >School Years</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/periods' >Periods</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/classrooms' >Classrooms</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/admin/classes' >Classes</NavLink>
                </li>
              </ul>
            </div>
          </nav>
        ) : (
          <nav className='sidebar-content'>
            <div className='sidebar-group'>
              <ul className='sidebar-menu'>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/notes'>Notes</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/catalog/programs' >Programs</NavLink>
                </li>
                <li className='sidebar-menu-item'>
                  <NavLink className='sidebar-menu-button' to='/dashboard/catalog/subjects' >Subjects</NavLink>
                </li>
                {isTeacher ?
                  <li className='sidebar-menu-item'>
                    <NavLink className='sidebar-menu-button' to='/dashboard/teacher/classes' >Classes</NavLink>
                  </li> :
                  <li className='sidebar-menu-item'>
                    <NavLink className='sidebar-menu-button' to='/dashboard/student/classes' >My Classes</NavLink>
                  </li>
                }
              </ul>
            </div>
          </nav>
        )}


        <div className="sidebar-footer">
          <ul className="sidebar-menu">

            <li className="sidebar-menu-item">
              <button className="dropdown-menu-trigger" onClick={togglePopperShow}>
                <span className="avatar">
                  <SquareUser width={32} height={32} />
                </span>
                <div>
                  <span>{user?.name || user.email}</span>
                  <span>{user.email}@email.com</span>
                </div>
                <EllipsisVertical width={16} height={16} />
              </button>
            </li>
          </ul>
        </div>
        {/* <div >
                <button onClick={() => logout().then(() => location.assign('/'))} disabled={loggingOut}>
                  {loggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div> 
      </aside>
      </ > */}




{/* <div className='sidebar-wrapper' style={{background:"#1E223E"}} onClick={()=>{popperShow && setPopperShow(false)}}> */ }

// {/* {popperShow && <div className="radix-popper-content-wrapper">
//       <div className="dropdown-menu-content">
//         <div className="dropdown-menu-item">
//           <LogOut width={16} height={16} />
//           <a onClick={() => {
//             togglePopperShow();
//             logout().then(() => location.assign('/'))
//           }}>
//             Log out
//           </a>
//         </div>

//       </div>
//     </div>} */}