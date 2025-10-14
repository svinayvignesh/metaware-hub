import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>) => (
  <CollapsiblePrimitive.CollapsibleContent
    className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      "data-[state=closed]:animate-accordion-up",
      "data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
