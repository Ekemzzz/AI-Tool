import {
  AudioLines,
  BotMessageSquare,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  CodeXml,
  GraduationCap,
  Headset,
  Image,
  Megaphone,
  Palette,
  PenLine,
  Users,
  Video,
  Zap,
} from 'lucide-react'

function CategoryIcon({ iconKey = 'assistant', className, size = 22, strokeWidth = 1.7 }) {
  const iconProps = {
    'aria-hidden': true,
    className,
    size,
    strokeWidth,
  }

  switch (iconKey) {
    case 'writing':
      return <PenLine {...iconProps} />
    case 'image':
      return <Image {...iconProps} />
    case 'video':
      return <Video {...iconProps} />
    case 'audio':
      return <AudioLines {...iconProps} />
    case 'coding':
      return <CodeXml {...iconProps} />
    case 'productivity':
      return <Zap {...iconProps} />
    case 'marketing':
      return <Megaphone {...iconProps} />
    case 'design':
      return <Palette {...iconProps} />
    case 'research':
      return <GraduationCap {...iconProps} />
    case 'business':
      return <BriefcaseBusiness {...iconProps} />
    case 'data':
      return <ChartNoAxesColumnIncreasing {...iconProps} />
    case 'support':
      return <Headset {...iconProps} />
    case 'hr':
      return <Users {...iconProps} />
    default:
      return <BotMessageSquare {...iconProps} />
  }
}

export default CategoryIcon
