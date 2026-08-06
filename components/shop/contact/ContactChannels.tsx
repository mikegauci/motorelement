import Link from "next/link";
import { Mail, Clock, Share2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionWrapper } from "@/components/shop/SectionWrapper";
import { SectionHeading } from "@/components/shop/SectionHeading";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@motorelement.com";

const channels = [
  {
    icon: Mail,
    title: "Email",
    body: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Clock,
    title: "Response time",
    body: "1–2 business days",
  },
  {
    icon: Share2,
    title: "Social",
    body: "@motorelement",
    href: "https://instagram.com",
  },
];

export function ContactChannels() {
  return (
    <SectionWrapper bg="obsidian">
      <Container size="narrow">
        <SectionHeading
          eyebrow="DIRECT"
          title="REACH US"
          subtitle="Prefer email or social? Use these channels anytime."
        />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <>
                <div className="text-ignition transition-transform duration-300 group-hover:scale-110">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 font-sub text-sm font-bold uppercase tracking-widest text-white">
                  {channel.title}
                </h3>
                <p className="mt-2 text-sm text-muted break-all">{channel.body}</p>
              </>
            );
            if (channel.href) {
              const external = channel.href.startsWith("http");
              if (external) {
                return (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center text-center"
                  >
                    {content}
                  </a>
                );
              }
              return (
                <a
                  key={channel.title}
                  href={channel.href}
                  className="group flex flex-col items-center text-center"
                >
                  {content}
                </a>
              );
            }
            return (
              <div
                key={channel.title}
                className="group flex flex-col items-center text-center"
              >
                {content}
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          Looking for shipping or returns info?{" "}
          <Link
            href="/#faq"
            className="text-white underline-offset-4 hover:underline"
          >
            Visit FAQ
          </Link>
        </p>
      </Container>
    </SectionWrapper>
  );
}
