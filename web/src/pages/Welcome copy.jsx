import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { Calendar, ChevronsRight } from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import logo from "./logo.svg"
import { toast } from "sonner"

function NavBar() {
  const logoElement = (
    <a className="flex items-center gap-2 border-none" href="#">
      <img className="w-8" src={logo} alt="logo" />
      <span className="text-xl font-medium">Scope</span>
    </a>
  );

  const navMenuElement = (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>Link</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );

  const navActionsElement = (
    <div className="flex items-center gap-2" >
      <Button size="lg" variant="ghost" className="" asChild>
        <Link to="/login">
          Log In
        </Link>
      </Button>
      <Button size="lg" className="">Open Account</Button>
    </div>
  );

  return (
    <div className="fixed top-4 z-50 w-full">
      <nav className="
      flex items-center justify-between  
      mx-auto 
      px-4 py-2
      w-360 
      bg-background/70 backdrop-blur-xl 
      border border-opacity-10 
      shadow-lg/5 
      "
      >
        {logoElement}
        {/* {navMenuElement} */}
        {navActionsElement}
      </nav>
    </div>
  )


}

export default function Welcome() {

  const titleElement = (
    <h1 className="flex flex-col items-center text-8xl">
      <span>Understand complex ideas.</span>
      <span>Build knowledge together.</span>
    </h1>
  )

  const descElement = (
    <p className=" text-xl w-120 mt-8 text-foreground/60">
      Create visual graphs of concepts where every node and link can be proposed, reviewed, and approved.
    </p>
  );

  const inputOpenAccountElement = (
    <div className="flex h-12 w-100 items-center  border px-1">
      <input
        type="email"
        placeholder="Enter your email"
        className="min-w-0 flex-1 px-2 outline-none"
      />
      <Button size="lg" className=""

        onClick={() => {
          toast.promise(
            () =>
              new Promise((resolve) =>
                setTimeout(() => resolve(), 2000)
              ),
            {
              loading: "This will only take a moment.",
              success: "Thanks! We'll be in touch soon.",
              error: "Something went wrong.",
            }
          )
        }}
      >
        Open Account
      </Button>
    </div>
  );

  const callToActionElement = (
    <div className=" flex mt-8 gap-4 items-center">
      {inputOpenAccountElement}


      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="lg" className=""
            disabled={true}
          >
            <Calendar />
            Book Call
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This feature is unavailabe at the moment.</p>

        </TooltipContent>
      </Tooltip>

    </div>
  );

  const inAppWrapperElement = (
    <>
      <a id="in-app" href="#in-app" className="flex items-center mt-12  text-foreground/60  gap-1">

        explore the interface
        <ChevronsRight className="w-3.5 h-3.5 "
        />
      </a>
      <div className="flex justify-center  bg-accent w-360 border  mt-1 mb-12 text-foreground/60">
        <img src="/demo.png" alt="Demo graph" />
      </div>
    </>
  )

  return (
    <>
      <NavBar />

      <main className="flex min-h-screen flex-col pt-40 bg-background">

        <section className="relative w-full">
          <div className="relative w-full overflow-x-clip">
            <div className="mx-auto max-w-360">

              <div className="flex flex-col items-center">
                {titleElement}
                {descElement}
                {callToActionElement}
                {inAppWrapperElement}
              </div>

            </div>
          </div>
        </section>

      </main>

    </>
  );
}