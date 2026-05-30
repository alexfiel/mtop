import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  AlertTriangle, 
  Car,
  Settings
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background flex flex-col h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="font-bold text-xl tracking-tight text-primary">MTOP System</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
        
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        
        <Link href="/drivers" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <Users className="h-4 w-4" />
          Drivers & Operators
        </Link>
        
        <Link href="/franchises" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <FileText className="h-4 w-4" />
          Franchises
        </Link>

        <Link href="/tricycles" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <Car className="h-4 w-4" />
          Tricycles & Permits
        </Link>
        
        <Link href="/violations" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <AlertTriangle className="h-4 w-4" />
          Violations
        </Link>
      </nav>

      <div className="p-4 border-t">
        <Link href="/settings/fees" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors">
          <Settings className="h-4 w-4" />
          Settings (Fees)
        </Link>
      </div>
    </aside>
  );
}
