import { Loader2 } from "lucide-react";

const Loader = () => {
    return (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
    )
}

export default Loader
