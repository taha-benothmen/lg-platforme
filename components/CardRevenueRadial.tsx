"use client"

import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CardItem = {
  title: string
  value: number | string
  isRevenue?: boolean
}

export function SectionCardsRadial({ cards }: { cards: CardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 px-4 lg:px-6">
      {cards.map((card, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>
              {card.isRevenue ? "Total CA" : `Total ${card.title}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 pb-0 flex items-center justify-center">
            <span className="text-3xl font-bold">
              {card.value}
              {card.isRevenue ? " DT" : ""}
            </span>
          </CardContent>

          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              <TrendingUp className="h-4 w-4" />
              {card.title} en progression
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
