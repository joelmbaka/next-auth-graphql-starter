// components/app-sidebar.tsx
"use client"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from "@/components/ui/sidebar"
  import { LucideGitGraph, Settings, NotebookPen, DollarSign, LucideUsers, Flashlight, Shirt, Package, ArrowUpRight, LucideUserRound, Newspaper } from "lucide-react"
  import { SiteSwitcher } from "@/components/navigation/SiteSwitcher"
  import { signOut, useSession } from "next-auth/react"
  import { useState } from "react"


  const menuItems = [
    {
      title: "News Feed",
      url: "/dashboard/feed",
      icon: Newspaper,
    },
    
  ]
  
  export function AppSidebar() {
    const { data: session } = useSession();
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

    return (
      <Sidebar
        className="flex flex-col" 
        // ensures the sidebar is a flex column container
      >
        {/* Header (top) */}
        <SidebarHeader className="border-b p-4">
          <SiteSwitcher />
        </SidebarHeader>
  
        {/* Main Scrollable Content (middle) */}
        <SidebarContent className="flex-1 overflow-y-auto p-2">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-1 text-xs font-semibold text-gray-500">
              MAIN
            </SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center space-x-2 p-2 text-sm">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
  
        {/* Footer (pinned at bottom) */}
        <SidebarFooter className="mt-auto border-t p-4">
          <div className="flex flex-col space-y-1 text-sm">
            
            <a href="#" className="hover:underline flex items-center space-x-2">  Give feedback <ArrowUpRight className="ml-1" />
            </a>
           <div className="mt-4 text-xs text-gray-500">
             <img 
               src={session?.user.image ?? "https://i.pravatar.cc/300"} 
               alt="User Avatar" 
               className="w-16 h-16 rounded-full cursor-pointer" 
               onClick={toggleDropdown}
             />
           </div>
           {isDropdownOpen && (
             <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
               <ul className="py-1">
                 <li>
                   <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                 </li>
                 <li>
                   <a href="#" onClick={() => signOut({ callbackUrl: '/' })} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" bg-red-500="true">Sign out</a>
                 </li>
               </ul>
             </div>
           )}
         </div>
        </SidebarFooter>
      </Sidebar>
    )
  }
  