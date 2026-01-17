"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100 border border-gray-200">
            <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#E21E36] to-[#ff4d5e]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[#E21E36] bg-white shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:border-[#c91a2e] cursor-grab active:cursor-grabbing" />
    </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

// Range Slider (two thumbs)
const RangeSlider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
        showValues?: boolean;
        unit?: string;
    }
>(({ className, showValues = true, unit = "", ...props }, ref) => (
    <div className="w-full">
        <SliderPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#E21E36] to-[#ff4d5e]" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[#E21E36] bg-white shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:border-[#c91a2e] cursor-grab active:cursor-grabbing" />
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[#E21E36] bg-white shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:border-[#c91a2e] cursor-grab active:cursor-grabbing" />
        </SliderPrimitive.Root>
        {showValues && props.value && Array.isArray(props.value) && (
            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <span>{props.value[0]}{unit}</span>
                <span>{props.value[1]}{unit}</span>
            </div>
        )}
    </div>
))
RangeSlider.displayName = "RangeSlider"

export { Slider, RangeSlider }
