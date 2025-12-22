import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";

export default async function SkeletonCard() {

  return (
    <Card>
        <CardHeader className="flex-row gap-4 items-center">
            <Skeleton className="w-12 h-12 rounded-full"/>
            <Skeleton className="h-6 flex-grow"/>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 flex-grow mt-4"/>
            <Skeleton className="h-4 flex-grow mt-4"/>
            <Skeleton className="h-4 w-1/2 mt-4"/>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-28"/>
        </CardFooter>
    </Card>
  );
}
