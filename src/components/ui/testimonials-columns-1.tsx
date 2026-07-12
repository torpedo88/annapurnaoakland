"use client";

import React from "react";
import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-lg shadow-primary/10 max-w-[44vw] sm:max-w-xs w-full"
                style={{ backgroundColor: "#1C1712", borderColor: "rgba(201,162,75,0.18)" }}
                key={i}
              >
                <div style={{ color: "#F3E9D6" }} className="text-xs sm:text-sm leading-relaxed">
                  {text}
                </div>
                <div className="flex items-center gap-2 mt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    loading="lazy"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5" style={{ color: "#F3E9D6" }}>
                      {name}
                    </div>
                    <div className="leading-5 tracking-tight" style={{ color: "#8A8276" }}>
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
