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
  const { logout } = useAuthStore()
  const [open, setOpen] = useState(false)

  const performLogout = async () => {
    try {
      await userRepo.logoutUser()
      // Clear token used for socket auth
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      logout() // Clear zustand store
      toast.success("Logout successful")
      navigate("/login")
    } catch (err) {
      toast.error("Logout failed")
    }
  }

  return (
    <>
      <button
        id="logoutBtn"
        className="hidden"
        onClick={() => setOpen(true)}
      >
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
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
    </>
  )
}

export default Logout
