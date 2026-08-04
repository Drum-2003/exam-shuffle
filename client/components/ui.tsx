"use client";

import {
  Button as HeroButton,
  Card as HeroCard,
  Spinner,
  type ButtonProps as HeroButtonProps,
  type CardContentProps,
  type CardDescriptionProps,
  type CardFooterProps,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps
} from "@heroui/react";
import type { ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = Omit<HeroButtonProps, "children" | "className"> & {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function Button({ children, className, disabled, isDisabled, isPending, ...props }: ButtonProps) {
  return (
    <HeroButton
      {...props}
      className={cn("quiz-button", className)}
      isDisabled={isDisabled || disabled}
      isPending={isPending}
    >
      {isPending ? <Spinner color="current" size="sm" /> : null}
      {children}
    </HeroButton>
  );
}

function CardRoot({ children, className, variant = "default", ...props }: CardProps) {
  return (
    <HeroCard {...props} className={cn("quiz-card", className)} variant={variant}>
      {children}
    </HeroCard>
  );
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <HeroCard.Header {...props} className={cn("quiz-card__header", className)} />;
}

function CardContent({ className, ...props }: CardContentProps) {
  return <HeroCard.Content {...props} className={cn("quiz-card__content", className)} />;
}

function CardFooter({ className, ...props }: CardFooterProps) {
  return <HeroCard.Footer {...props} className={cn("quiz-card__footer", className)} />;
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <HeroCard.Title {...props} className={cn("quiz-card__title", className)} />;
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <HeroCard.Description {...props} className={cn("quiz-card__description", className)} />;
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
  Title: CardTitle,
  Description: CardDescription
});
