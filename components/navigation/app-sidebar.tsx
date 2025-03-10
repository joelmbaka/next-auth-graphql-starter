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
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
  } from "@/components/ui/sidebar"
  import { ArrowUpRight, Newspaper, ChevronDown, Mail, PenSquare, Calendar, Twitter, Facebook, Linkedin, Users, FileText, Share2, Share } from "lucide-react"
  import { SiteSwitcher } from "@/components/navigation/SiteSwitcher"
  import { signOut, useSession } from "next-auth/react"
  import { useState } from "react"
import { Video } from "lucide-react"

  const menuItems = [
   {
     title: "Productivity",
     icon: PenSquare,
     subItems: [
       {title: "Google Calendar", url: "/dashboard/calendar"},
       {title: "Gmail", url: "/dashboard/gmail"},
       {title: "Read Emails", url: "/dashboard/gmail/read"},
       {title: "Craft an Email", url: "/dashboard/gmail/write"}
     ]
   },
   {
     title: "News Feed", 
     icon: Newspaper,
     url: "/dashboard/news",
     subItems: [
       {title: "Fetch Latest News", url: "/dashboard/news/fetch"},
       {title: "Craft an Article", url: "/dashboard/news/craft"}
     ]
   },
   {
     title: "Social",
     icon: Share2,
     subItems: [
       {
         title: "YouTube",
         icon: Video,
         subItems: [
           {title: "My Subscriptions", url: "/dashboard/youtube/subscriptions"},
           {title: "Search Channels", url: "/dashboard/youtube/search-channels"},
           {title: "Search Videos", url: "/dashboard/youtube/search-videos"}
         ]
       },
       {title: "X.com", url: "/dashboard/x", icon: Twitter},
       {title: "Facebook.com", url: "/dashboard/facebook", icon: Facebook},
       {title: "LinkedIn.com", url: "/dashboard/linkedin", icon: Linkedin}
     ]
   },
   {
     title: "Content Studio",
     icon: FileText,
     subItems: [
       {title: "X content", url: "/dashboard/content/x"},
       {title: "Facebook content", url: "/dashboard/content/facebook"},
       {title: "LinkedIn content", url: "/dashboard/content/linkedin"}
     ]
   },
  ]
  
  export function AppSidebar() {
    const { data: session } = useSession();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());

    const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
    const toggleSubMenu = (title: string) => {
      setOpenSubMenus((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(title)) {
          newSet.delete(title);
        } else {
          newSet.add(title);
        }
        return newSet;
      });
    };

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
                  {item.subItems ? (
                    <>
                      <SidebarMenuButton 
                        onClick={() => toggleSubMenu(item.title)}
                        className="flex items-center justify-between p-2 text-sm w-full"
                      >
                        <div className="flex items-center space-x-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            openSubMenus.has(item.title) ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </SidebarMenuButton>
                      {openSubMenus.has(item.title) && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton href={subItem.url}>
                                {subItem.title}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center space-x-2 p-2 text-sm">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
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
  