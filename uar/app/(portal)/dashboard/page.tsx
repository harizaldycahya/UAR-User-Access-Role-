import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Notification{
  id : string, 
  application : string, 
  title : string, 
  description : string, 
  date : string, 
  active : string
}

async function getNotification():Promise<Notification[]>{
  const result = await fetch('http://localhost:4000/notification')

  await new Promise((resolve) => setTimeout(resolve, 3000))

  return result.json()
}

export default async function Dashboard() {

  const notifications = await getNotification()

  return (
      <main> 
        <div className="grid grid-cols-3 gap-8">
          {notifications.map(notification => (
            <Card key={notification.id} className="flex flex-col justify-between">
              <CardHeader className="flex-row gap-4 items-center">
                <div>
                  <CardTitle>{notification.application} {notification.title}</CardTitle>
                  <CardDescription>{notification.date}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>{notification.description}</p>
              </CardContent>
              <CardFooter>
                <Button>Open Application</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
  );
}
