"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function ItemAccountList({ accounts }: { accounts: any[] }) {
  if (accounts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-md">
        No item accounts found.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Account Number</TableHead>
            <TableHead>Default Amount</TableHead>
            <TableHead>Fund Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.account_name}</TableCell>
              <TableCell>{account.account_number}</TableCell>
              <TableCell>₱{account.default_amount.toFixed(2)}</TableCell>
              <TableCell>{account.fundtype}</TableCell>
              <TableCell>
                {account.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>{format(new Date(account.createdAt), "MMM d, yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
