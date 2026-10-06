import { useSettings } from '@/contexts/settings.context';
import { DefaultSeo as NextDefaultSeo } from 'next-seo';

const DefaultSeo = () => {
  const settings = useSettings();
  return (
    <NextDefaultSeo
      title={settings.siteTitle ?? 'PickBazar'}
      titleTemplate={`%s | ${settings?.seo?.metaTitle ?? 'E-Commerce'}`}
      description={settings?.seo?.metaDescription || settings?.siteSubtitle}
      canonical={settings?.seo?.canonicalUrl}
      openGraph={{
        title: settings?.seo?.ogTitle,
        description: settings?.seo?.ogDescription,
        type: 'website',
        locale: 'en_US',
        site_name: settings?.siteTitle,
        images: [
          {
            url: settings?.seo?.ogImage?.original,
            width: 800,
            height: 600,
            alt: settings?.seo?.ogTitle,
          },
        ],
      }}
      twitter={{
        handle: settings?.seo?.twitterHandle,
        site: settings?.siteTitle,
        cardType: settings?.seo?.twitterCardType,
      }}
      additionalMetaTags={[
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1 maximum-scale=1',
        },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'theme-color',
          content: '#ffffff',
        },
      ]}
      additionalLinkTags={[
        // Icônes E.doto (emblème du site) ; ?v=2 force le navigateur à oublier l'ancienne icône
        {
          rel: 'icon',
          href: '/favicon.ico?v=2',
          sizes: 'any',
        },
        {
          rel: 'icon',
          href: '/favicon.png?v=2',
          type: 'image/png',
        },
        {
          rel: 'apple-touch-icon',
          href: '/icons/apple-icon-180.png?v=2',
        },
        {
          rel: 'manifest',
          href: '/manifest.json',
        },
      ]}
    />
  );
};

export default DefaultSeo;
