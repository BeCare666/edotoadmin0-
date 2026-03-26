import OwnerLayout from '@/components/layouts/owner';
import ShopForm from '@/components/shop/shop-form';
import { adminAndOwnerOnly } from '@/utils/auth-utils';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { motion, useScroll, useTransform } from "framer-motion";
import banner1 from "@/assets/images/banner/banner1.jpg";
import Image from 'next/image';
import { useRef } from "react";
export default function CreateShopPage() {
  const { t } = useTranslation();
  const ref1 = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref1,
    offset: ["start end", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);

  return (
    <>
      <div className="hidden flex border-b border-dashed border-border-base pb-5 md:pb-7">
        <h1 className="text-lg font-semibold text-heading">
          {t('form:form-title-create-shop')}
        </h1>
      </div>

      {/* Wrapper responsive pour ShopForm */}
      <div className="mt-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full max-w-7xl mx-auto">
        {/* ================== SECTION 3 ================== */}
        <section
          ref={ref1}
          className="relative w-full min-h-[70vh] flex items-center justify-center px-6 md:px-12 py-20 bg-black/70 overflow-hidden"
        >
          <motion.div style={{ y: y1 }} className="absolute inset-0 -z-10">
            <Image
              src={banner1}
              alt="Connexion aux acheteurs"
              fill
              className="object-cover brightness-75"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center text-white flex flex-col gap-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold">
              Connectez-vous à des millions d’acheteurs grâce au B Space de
              Galiléecommerce.com
            </h2>
            <p className="text-lg text-gray-200">
              Les B Spaces, abréviation de Business Space, correspondent à vos
              boutiques en ligne sur Galileecommerce.com
            </p>
          </motion.div>
        </section>
        <ShopForm />
      </div>

    </>
  );
}
CreateShopPage.authenticate = {
  permissions: adminAndOwnerOnly,
};
//CreateShopPage.Layout = OwnerLayout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['common', 'form'])),
  },
});
