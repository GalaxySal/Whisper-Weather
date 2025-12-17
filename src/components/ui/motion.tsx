import { motion, AnimatePresence, MotionProps, Variants } from "framer-motion";
import { ReactNode, forwardRef } from "react";

// Performance optimized variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      duration: 0.3,
    },
  },
};

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Performance optimized motion components
interface MotionContainerProps {
  children: ReactNode;
  className?: string;
  initial?: string;
  animate?: string;
}

export const MotionContainer = ({
  children,
  className = "",
  initial = "hidden",
  animate = "visible",
}: MotionContainerProps) => (
  <motion.div
    className={className}
    variants={containerVariants}
    initial={initial}
    animate={animate}
    layout
  >
    {children}
  </motion.div>
);

interface MotionItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  initial?: string;
  animate?: string;
}

export const MotionItem = ({
  children,
  className = "",
  delay = 0,
  initial = "hidden",
  animate = "visible",
}: MotionItemProps) => (
  <motion.div
    className={className}
    variants={itemVariants}
    initial={initial}
    animate={animate}
    transition={{ delay }}
    whileHover={{
      scale: 1.02,
      transition: { duration: 0.2 },
    }}
    style={{ willChange: "transform, opacity" }}
  >
    {children}
  </motion.div>
);

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className = "",
}: PageTransitionProps) => (
  <motion.div
    className={className}
    variants={pageVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    layout
    style={{ willChange: "transform, opacity" }}
  >
    {children}
  </motion.div>
);

interface ModalMotionProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
}

export const ModalMotion = ({
  children,
  className = "",
  isOpen,
}: ModalMotionProps) => (
  <AnimatePresence mode="wait">
    {isOpen && (
      <motion.div
        className={className}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Optimized button with hover effects
interface MotionButtonProps extends MotionProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className = "", onClick, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={{
        scale: disabled ? 1 : 1.05,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: disabled ? 1 : 0.95,
        transition: { duration: 0.1 },
      }}
      style={{ willChange: "transform" }}
      {...props}
    >
      {children}
    </motion.button>
  ),
);

MotionButton.displayName = "MotionButton";

// Optimized card with hover effects
interface MotionCardProps {
  children: ReactNode;
  className?: string;
}

export const MotionCard = ({ children, className = "" }: MotionCardProps) => (
  <motion.div
    className={className}
    whileHover={{
      y: -4,
      transition: { duration: 0.2 },
    }}
    style={{ willChange: "transform" }}
  >
    {children}
  </motion.div>
);

// List stagger animation
interface MotionListProps {
  children: ReactNode;
  className?: string;
}

export const MotionList = ({ children, className = "" }: MotionListProps) => (
  <motion.div
    className={className}
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    layout
  >
    {children}
  </motion.div>
);

// Fade in animation for any element
interface FadeInProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}

export const FadeIn = ({
  children,
  className = "",
  direction = "up",
  delay = 0,
}: FadeInProps) => {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === "up" && { y: 20 }),
      ...(direction === "down" && { y: -20 }),
      ...(direction === "left" && { x: 20 }),
      ...(direction === "right" && { x: -20 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

// Scale animation
interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const ScaleIn = ({
  children,
  className = "",
  delay = 0,
}: ScaleInProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25,
      delay,
    }}
    style={{ willChange: "transform, opacity" }}
  >
    {children}
  </motion.div>
);
