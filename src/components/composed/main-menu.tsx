
import { Fragment, type ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { MenuItem } from "@/components/ui/menu-item"
import { Separator } from "@/components/ui/separator"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface MainMenuItem {
  id: string
  icon: ReactNode
  label: string
  badge?: number
}

export interface MainMenuSubSection {
  label: string
  items: MainMenuItem[]
}

export interface MainMenuSection {
  label?: string
  items?: MainMenuItem[]
  subSections?: MainMenuSubSection[]
}

interface MainMenuProps {
  sections: MainMenuSection[]
  activeId: string
  onSelect: (id: string) => void
  collapsed?: boolean
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

function MainMenu({
  sections,
  activeId,
  onSelect,
  collapsed = false,
  header,
  footer,
  className,
}: MainMenuProps) {
  const renderItem = (item: MainMenuItem) => {
    const menuItem = (
      <MenuItem
        icon={item.icon}
        label={item.label}
        badge={item.badge}
        active={activeId === item.id}
        collapsed={collapsed}
        onClick={() => onSelect(item.id)}
      />
    )
    return collapsed ? (
      <div key={item.id} className="flex w-full justify-center">
        <Tooltip content={item.label} side="right">
          {menuItem}
        </Tooltip>
      </div>
    ) : (
      <div key={item.id}>{menuItem}</div>
    )
  }

  return (
    <Card
      className={cn(
        "flex flex-col py-2 px-2 h-full transition-[width] duration-300",
        collapsed ? "w-16 items-center" : "w-60",
        className
      )}
    >
      {header && (
        <>
          <div
            className={cn(
              "flex items-center w-full",
              collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
            )}
          >
            {header}
          </div>
          <Separator className="my-1" />
        </>
      )}

      <div className="flex-1 w-full space-y-0.5 overflow-y-auto">
        {sections.map((section, si) => (
          <Fragment key={si}>
            {si > 0 && <Separator className="my-1.5" />}
            {!collapsed && section.label && (
              <p className="px-3 pt-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}

            {section.items?.map(renderItem)}

            {section.subSections?.map((sub, ssi) => (
              <Fragment key={`${si}-${ssi}`}>
                {!collapsed ? (
                  <p
                    className={cn(
                      "px-3 pb-1 text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground/60",
                      ssi === 0 ? "pt-1" : "pt-2.5"
                    )}
                  >
                    {sub.label}
                  </p>
                ) : (
                  ssi > 0 && <div aria-hidden className="h-2" />
                )}
                {sub.items.map(renderItem)}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>

      {footer && (
        <>
          <Separator className="my-1" />
          <div
            className={cn(
              "w-full",
              collapsed ? "flex justify-center px-0 py-2" : "px-2 py-2"
            )}
          >
            {footer}
          </div>
        </>
      )}
    </Card>
  )
}

export { MainMenu }
