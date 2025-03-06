"use client"
import { useSession } from "next-auth/react"
import { useState } from "react"
import SigninModal from "../SigninModal"
import { Button } from "@/components/ui/button"
import AddNewSiteModal from "../AddNewSiteModal"

export function AddNewSiteButton() {
    const { data: session } = useSession()
    const [isAddNewSiteOpen, setAddNewSiteOpen] = useState(false)
    const [isSigninOpen, setSigninOpen] = useState(false)

    const handleClick = () => {
        if (session) {
            setAddNewSiteOpen(true)
        } else {
            setSigninOpen(true)
        }
    }

    const handleClose = () => {
        setAddNewSiteOpen(false)
        setSigninOpen(false)
    }

    return (
        <>      
            <Button onClick={handleClick}>Add New Site</Button>
            <AddNewSiteModal isOpen={isAddNewSiteOpen} onClose={handleClose} />
            <SigninModal isOpen={isSigninOpen} onClose={handleClose} />
        </>
    )
}