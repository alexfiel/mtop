"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type AuditLogWithUser = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changes: string;
  userId: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
};

export function AuditLogList({ initialLogs }: { initialLogs: AuditLogWithUser[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);

  const filteredLogs = logs.filter((log) => 
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user?.name && log.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UPDATE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "DELETE": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const parseChanges = (changes: string) => {
    try {
      return JSON.stringify(JSON.parse(changes), null, 2);
    } catch {
      return changes;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            System-wide transaction and modification ledger
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead className="w-[100px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), "PP pp")}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.entity}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <Badge variant="outline" className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedLog.createdAt), "PP pp")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-sm">{selectedLog.entityId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                  <p className="font-medium">
                    {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : "System/Unknown"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Change Payload</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
                  {parseChanges(selectedLog.changes)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
