import React from 'react'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function CardContainer({ className, children, style, ...rest }: DivProps) {
  return (
    <div
      className={`[perspective:1000px] group/card ${className || ''}`}
      style={{ transformStyle: 'preserve-3d', ...(style || {}) }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardBody({ className, children, style, ...rest }: DivProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = `rotateX(0deg) rotateY(0deg)`
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0..1
    const py = (e.clientY - rect.top) / rect.height // 0..1
    const rotY = (px - 0.5) * 20 // -10..10
    const rotX = (0.5 - py) * 20 // -10..10
    el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }

  return (
    <div
      ref={ref}
      className={`relative transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d] ${className || ''}`}
      style={{ overflow: 'hidden', borderRadius: 'inherit', ...(style || {}) }}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      onMouseEnter={onMouseMove}
      {...rest}
    >
      {children}
    </div>
  )
}

type CardItemProps<E extends React.ElementType> = {
  as?: E
  translateZ?: number | string
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<E>, 'as' | 'children' | 'className'>

export function CardItem<E extends React.ElementType = 'div'>(props: CardItemProps<E>) {
  const { as, translateZ, className, style, children, ...rest } = props as CardItemProps<any>
  const Comp = (as || 'div') as any
  const tz = typeof translateZ === 'number' ? `${translateZ}px` : translateZ || '0px'
  return (
    <Comp
      className={className}
      style={{
        transform: `translateZ(${tz})`,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
    </Comp>
  )
}
