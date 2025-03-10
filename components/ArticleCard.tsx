import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";

interface ArticleCardProps extends React.ComponentProps<typeof Card> {
  title: string;
  description?: string;
  content: string;
  featuredImage: string;
  imageUrls: string[];
  source: string;
  sourceAvatar: string;
  author: string;
}

export function ArticleCard({
  title,
  description,
  content,
  featuredImage,
  imageUrls,
  source,
  sourceAvatar,
  author,
  className,
  ...props
}: ArticleCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <Image src={featuredImage} alt={title} width={800} height={192} className="w-full h-48 object-cover rounded-lg" />
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {imageUrls.map((image, index) => (
            <Image key={index} src={image} alt={`${title} - ${index}`} width={96} height={64} className="w-24 h-16 object-cover rounded" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Image src={sourceAvatar} alt={source} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
          <span>{author}</span>
        </div>
        <span>{source}</span>
      </CardFooter>
    </Card>
  );
}
