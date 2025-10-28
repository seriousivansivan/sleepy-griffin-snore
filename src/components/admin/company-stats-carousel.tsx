"use client";

import Image from "next/image";
import React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export type CompanyStat = {
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  total_vouchers: number;
  total_amount: number;
};

type CompanyStatsCarouselProps = {
  stats: CompanyStat[];
  isLoading: boolean;
};

export function CompanyStatsCarousel({ stats, isLoading }: CompanyStatsCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Company Breakdown</h2>
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-48 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Company Breakdown</h2>
        <div className="flex items-center justify-center h-40 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No company activity in this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Company Breakdown</h2>
      <Carousel
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: "start",
          loop: true,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {stats.map((stat) => (
            <CarouselItem key={stat.company_id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-4">
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center aspect-square">
                  <div className="w-16 h-16 mb-2 flex items-center justify-center bg-muted rounded-md">
                    {stat.company_logo_url ? (
                      <Image
                        src={stat.company_logo_url}
                        alt={`${stat.company_name} logo`}
                        width={64}
                        height={64}
                        className="object-contain rounded-md p-1"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate w-full" title={stat.company_name}>
                    {stat.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.total_vouchers} voucher{stat.total_vouchers !== 1 ? 's' : ''}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {stat.total_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
}