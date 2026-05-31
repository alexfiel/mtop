"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format } from "date-fns";
import { EditTricycleDialog } from "./edit-tricycle-dialog";

export function TricycleList({ tricycles }: { tricycles: any[] }) {
  if (tricycles.length === 0) {
    return <div className="p-8 text-center text-muted-foreground border rounded-md">No tricycles registered yet.</div>;
  }

  return (
    <div className="border rounded-md bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Body No.</TableHead>
            <TableHead>Plate No.</TableHead>
            <TableHead>Make & Model</TableHead>
            <TableHead>Franchise No.</TableHead>
            <TableHead>Main Driver</TableHead>
            <TableHead>Photo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tricycles.map((tricycle) => {
            const frontPhoto = tricycle.documents?.find((doc: any) => doc.documentType === "TRICYCLE_FRONT");
            const backPhoto = tricycle.documents?.find((doc: any) => doc.documentType === "TRICYCLE_BACK");
            const leftPhoto = tricycle.documents?.find((doc: any) => doc.documentType === "TRICYCLE_LEFT");
            const rightPhoto = tricycle.documents?.find((doc: any) => doc.documentType === "TRICYCLE_RIGHT");
            
            const hasAnyPhoto = frontPhoto || backPhoto || leftPhoto || rightPhoto;

            return (
            <TableRow key={tricycle.id}>
              <TableCell className="font-medium">{tricycle.bodyNumber}</TableCell>
              <TableCell>{tricycle.plateNo}</TableCell>
              <TableCell>{tricycle.make} {tricycle.model} ({tricycle.color})</TableCell>
              <TableCell>{tricycle.franchise?.franchiseNo || "N/A"}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {tricycle.mainDriver ? (
                    <span>Main: {tricycle.mainDriver.lastName}, {tricycle.mainDriver.firstName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No Main Driver</span>
                  )}
                  {tricycle.extraDriver && (
                    <span className="text-sm text-slate-500">Extra: {tricycle.extraDriver.lastName}, {tricycle.extraDriver.firstName}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {hasAnyPhoto ? (
                  <Dialog>
                    <DialogTrigger render={<div className="cursor-pointer hover:opacity-80 transition-opacity" />}>
                      {frontPhoto ? (
                        <img src={frontPhoto.fileUrl} alt="Front View" className="w-16 h-12 object-cover rounded-md border" />
                      ) : (
                        <div className="w-16 h-12 bg-slate-100 flex items-center justify-center rounded-md border text-xs text-muted-foreground font-medium">View</div>
                      )}
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Tricycle Photos (Body No: {tricycle.bodyNumber})</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center mt-4 px-12 pb-4">
                        <Carousel className="w-full max-w-xl">
                          <CarouselContent>
                            {frontPhoto && (
                              <CarouselItem>
                                <div className="space-y-2 p-1 text-center">
                                  <span className="text-sm font-semibold text-muted-foreground">Front View</span>
                                  <img src={frontPhoto.fileUrl} alt="Front View" className="w-full aspect-[4/3] object-cover rounded-md border" />
                                </div>
                              </CarouselItem>
                            )}
                            {backPhoto && (
                              <CarouselItem>
                                <div className="space-y-2 p-1 text-center">
                                  <span className="text-sm font-semibold text-muted-foreground">Back View</span>
                                  <img src={backPhoto.fileUrl} alt="Back View" className="w-full aspect-[4/3] object-cover rounded-md border" />
                                </div>
                              </CarouselItem>
                            )}
                            {leftPhoto && (
                              <CarouselItem>
                                <div className="space-y-2 p-1 text-center">
                                  <span className="text-sm font-semibold text-muted-foreground">Left Side View</span>
                                  <img src={leftPhoto.fileUrl} alt="Left Side View" className="w-full aspect-[4/3] object-cover rounded-md border" />
                                </div>
                              </CarouselItem>
                            )}
                            {rightPhoto && (
                              <CarouselItem>
                                <div className="space-y-2 p-1 text-center">
                                  <span className="text-sm font-semibold text-muted-foreground">Right Side View</span>
                                  <img src={rightPhoto.fileUrl} alt="Right Side View" className="w-full aspect-[4/3] object-cover rounded-md border" />
                                </div>
                              </CarouselItem>
                            )}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="w-16 h-12 bg-slate-50 flex items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">N/A</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={tricycle.status === "ACTIVE" ? "default" : "secondary"}>
                  {tricycle.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <EditTricycleDialog tricycle={tricycle} />
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
