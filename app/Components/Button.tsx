"use client"

import React from "react"

// Button component accepts children (button text or elements), an optional className for extra styling,
// and any other standard button props (like onClick, type, etc.).
export function Button({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      // Combine default styles with any additional classes passed in via 'className'
      className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded ${className ?? ""}`}
      {...props}  // Pass along any additional props (e.g., onClick)
    >
      {children}  {/* Render whatever is between the <Button> tags */}
    </button>
  )
}
