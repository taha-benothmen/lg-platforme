import {
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/* ================= Types ================= */

type CardItem = {
  title: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
  subtitle?: string
}

/* ================= Component ================= */

export function SectionCards({ cards }: { cards: CardItem[] }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => {
        const isUp = card.trend === "up"

        return (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>

              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>

              {card.trend && card.trendValue && (
                <CardAction>
                  <Badge variant="outline">
                    {isUp ? <IconTrendingUp /> : <IconTrendingDown />}
                    {card.trendValue}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>

            {card.subtitle && (
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {card.subtitle}
                  {isUp ? (
                    <IconTrendingUp className="size-4" />
                  ) : (
                    <IconTrendingDown className="size-4" />
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        )
      })}
    </div>
  )
}
