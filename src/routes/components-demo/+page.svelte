<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Spinner } from '$lib/components/ui/spinner';
  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<svelte:head>
  <title>Component Demo - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
  <div>
    <h1 class="text-3xl font-bold mb-2">UI Components Demo</h1>
    <p class="text-muted-foreground">Showcase of all available UI components</p>
  </div>

  <!-- Buttons -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Buttons</h2>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div class="flex flex-wrap gap-4 mt-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </CardContent>
  </Card>

  <!-- Inputs -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Inputs</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4 max-w-md">
        <div>
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div>
          <Label for="message">Message</Label>
          <Textarea id="message" placeholder="Type your message here" />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Alerts -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Alerts</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <Alert>
          <AlertTitle>Info Alert</AlertTitle>
          <AlertDescription>This is a default information alert.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>This is a destructive error alert.</AlertDescription>
        </Alert>
      </div>
    </CardContent>
  </Card>

  <!-- Badges -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Badges</h2>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </CardContent>
  </Card>

  <!-- Loading States -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Loading States</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <div class="flex gap-4 items-center">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Cards -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Card Example</h2>
      <p class="text-sm text-muted-foreground">This is a card with header, content, and footer</p>
    </CardHeader>
    <CardContent>
      <p>This is the card content area. You can put any content here.</p>
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
</div>

