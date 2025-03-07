import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface ArticleCardProps extends React.ComponentProps<typeof Card> {
  id: string;
  title: string;
  description?: string;
  content: string;
  url: string;
  featuredImage: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  source: string;
  sourceAvatar: string;
  author: string;
  category: string;
  location: string;
}

export function ArticleCard({
  id,
  title,
  description,
  content,
  url,
  featuredImage,
  imageUrls,
  createdAt,
  updatedAt,
  source,
  sourceAvatar,
  author,
  category,
  location,
  className,
  ...props
}: ArticleCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <img src={featuredImage} alt={title} className="w-full h-48 object-cover rounded-lg" />
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {imageUrls.map((image, index) => (
            <img key={index} src={image} alt={`${title} - ${index}`} className="w-24 h-16 object-cover rounded" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img 
            src={sourceAvatar} 
            alt={source} 
            className="w-6 h-6 rounded-full object-cover" 
          />
          <span>{author}</span>
        </div>
        <span>{source}</span>
      </CardFooter>
    </Card>
  );
}
