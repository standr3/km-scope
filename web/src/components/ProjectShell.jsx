import { useNavigate } from "react-router-dom";
import { X } from 'lucide-react';
import Button from "./ui/Button/Button";


export default function ProjectShell({ children }) {
  const navigate = useNavigate();

  return (
    <div className="m-[-16px] relative h-[calc(100%+32px)] ">
      <header className=" absolute top-0 left-0 p-2 z-10 ">
        <Button
          size="icon-lg"
          variant="outline" 
          onClick={() => navigate(-1)}
          className="font-semibold hover:underline inline-block"
        >
          <X />
        </Button>
      </header>

      <div className="absolute top-0 left-0 right-0 h-full  "> 
        {children}
      
      </div>
    </div>
  );
}