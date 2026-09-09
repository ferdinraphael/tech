import { ServiceDetailLayout, ServiceSection } from './ServiceDetailLayout'
import styles from './Services.module.css'

export function SoftwareDevelopmentPage() {
  return (
    <ServiceDetailLayout
      eyebrow="SOFTWARE DEVELOPMENT"
      title="From a problem or idea to working software."
      intro={<>
        <p>Tell me what you want to build or fix. No technical specification needed. I can help scope it, then build, test, launch, and hand it over.</p>
      </>}
      remote="Remote engagements only."
      action="Discuss your requirement"
      closingTitle="Have something you want built?"
      closingCopy="Tell me what you want to build. You do not need to know the technology."
      closingAction="Discuss your requirement"
    >
      <ServiceSection id="three-ways-we-can-work" title="Three ways we can work">
        <div className={styles.offer}>
          <h3>Build something new</h3>
          <p>For business websites, internal tools, dashboards, automations, small web apps, and browser tools.</p>
          <p>I can handle the build through launch, including basic UI/UX decisions, hosting, domain setup, and handover where needed.</p>
          <p className={styles.pricing}><strong>Pricing:</strong> Usually fixed-price once the scope is clear.</p>
        </div>
        <div className={styles.offer}>
          <h3>Build or extend a product</h3>
          <p>For a product idea that needs to become an MVP, or an existing product that needs new features, modules, APIs, or integrations.</p>
          <p>I can help decide what belongs in the first useful version and build it.</p>
          <h4>When the idea is still unclear</h4>
          <p>If we cannot scope the build from an initial conversation, I may suggest paid discovery to plan it and estimate the work.</p>
          <p>The discovery output is yours even if someone else builds the product.</p>
          <p className={styles.pricing}><strong>Pricing:</strong> Usually priced by agreed milestones after discovery.</p>
        </div>
        <div className={styles.offer}>
          <h3>Part-time development support</h3>
          <p>For individuals, founders, businesses, and teams needing development help without another full-time hire.</p>
          <ul>
            <li>features, APIs, and integrations;</li>
            <li>debugging, code review, and refactoring;</li>
            <li>understanding unfamiliar code and planning changes;</li>
            <li>deployment and configuration issues.</li>
          </ul>
          <p>Built something with AI and got stuck? I can step in, understand what you have, fix what is broken, and help finish it.</p>
          <p>I can work independently or alongside your team. You do not need perfectly written tickets.</p>
          <p className={styles.pricing}><strong>Engagement:</strong> Ad-hoc hourly work or reserved weekly/monthly development capacity.</p>
          <p>Reserved capacity is not an on-call or 24/7 support arrangement.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="which-one-fits" title="Not sure which option fits?">
        <p>Tell me what you're trying to build or fix and I'll help work out the right approach.</p>
      </ServiceSection>
      <ServiceSection id="how-a-project-usually-works" title="How a project usually works">
        <div className={styles.subsection}>
          <h3>1. Start with the outcome</h3>
          <p>Tell me what you want the software to do.</p>
        </div>
        <div className={styles.subsection}>
          <h3>2. Work out the scope</h3>
          <p>We agree on what to build and how to approach it.</p>
        </div>
        <div className={styles.subsection}>
          <h3>3. Build</h3>
          <p>I build the software and keep you updated.</p>
        </div>
        <div className={styles.subsection}>
          <h3>4. Test and launch</h3>
          <p>We check that it works as agreed and deploy it.</p>
        </div>
        <div className={styles.subsection}>
          <h3>5. Handover</h3>
          <p>You get access, source code where applicable, usage guidance, and an agreed post-launch defect-support period.</p>
        </div>
      </ServiceSection>
      <ServiceSection id="technical-fit" title="Technical fit">
        <p>My strongest working areas include:</p>
        <ul>
          <li>.NET / C#</li>
          <li>TypeScript / JavaScript</li>
          <li>Angular / React</li>
          <li>APIs and integrations</li>
          <li>Azure / cloud</li>
          <li>SQL / data</li>
          <li>CI/CD and delivery workflows</li>
          <li>AI-assisted features and integrations when they solve a real product problem</li>
        </ul>
      </ServiceSection>
      <ServiceSection id="relevant-experience" title="Relevant experience">
        <p>Work I have handled includes:</p>
        <ul>
          <li>a virtual-classroom product, from requirements through architecture and implementation;</li>
          <li>APIs, integrations, and application modules within larger systems;</li>
          <li>enterprise .NET, Angular, Azure, and delivery environments;</li>
          <li>browser-based tools and interactive software.</li>
        </ul>
        <p>See Projects and Built &amp; Published for public work; client details stay private.</p>
      </ServiceSection>
      <ServiceSection id="a-practical-boundary" title="What this doesn't include">
        <p>Branding, logo design, extensive copywriting, photography, marketing campaigns, and full SEO work are not automatically included; specialist work is identified during scoping.</p>
      </ServiceSection>
    </ServiceDetailLayout>
  )
}
