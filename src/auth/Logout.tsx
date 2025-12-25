import { useState } from "react"
import { toast } from "sonner"
import { userRepo } from "@/repositories/userRepo"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/hooks/store/authStore"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const Logout = () => {
  const navigate = useNavigate()
  const { logout, isLogoutDialogOpen, setLogoutDialogOpen } = useAuthStore()

  const performLogout = async () => {
    try {
      await userRepo.logoutUser()
      // Clear token used for socket auth
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('e2e_private_key')
      localStorage.removeItem('e2e_public_key')
      logout() // Clear zustand store
      toast.success("Logout successful")
      navigate("/login")
    } catch (err) {
      toast.error("Logout failed")
      setLogoutDialogOpen(false)
    }
  }

  return (
    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Do you really want to logout from your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={performLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default Logout
