'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/ImageUpload';
import { useAppContext } from '@/contexts/AppContext';
import {
  persistUploadedImageCache,
  restoreUploadedImageFromCache,
} from '@/lib/utils/uploadedImageCache';

type BannerGroup = {
  original: string;
  designed: string;
};

const HOME_BANNER_GROUPS: BannerGroup[] = [
  {
    original: '/homebanner/orange-original.jpeg',
    designed: '/homebanner/orange-designed.png',
  },
  {
    original: '/homebanner/cucumber-original.jpeg',
    designed: '/homebanner/cucumber-designed.png',
  },
  {
    original: '/homebanner/broccoli-original.jpeg',
    designed: '/homebanner/broccoli-designed.jpg',
  },
  {
    original: '/homebanner/lancome-original.jpeg',
    designed: '/homebanner/lancome-designed.jpg',
  },
];

const FALLBACK_BANNER_SLIDES = [
  {
    id: 'hero',
    accent: 'from-[#8cc8ff] via-[#5f77ff] to-[#8759ff]',
    surface: 'from-[#0f1733] via-[#18224c] to-[#0d132d]',
    product: 'from-[#ffc779] via-[#ff9c56] to-[#ff6b54]',
    decor: 'hero' as const,
  },
  {
    id: 'life',
    accent: 'from-[#ffd28a] via-[#ff9f63] to-[#ff6c93]',
    surface: 'from-[#2a1b15] via-[#47261a] to-[#24120f]',
    product: 'from-[#ffdda1] via-[#ffb264] to-[#ff7f4e]',
    decor: 'life' as const,
  },
  {
    id: 'process',
    accent: 'from-[#54d8ff] via-[#4f8dff] to-[#6a69ff]',
    surface: 'from-[#061527] via-[#0f2a4b] to-[#091a31]',
    product: 'from-[#8ce3ff] via-[#47b3ff] to-[#5977ff]',
    decor: 'process' as const,
  },
  {
    id: 'detail',
    accent: 'from-[#9dffd5] via-[#50d2a6] to-[#1d8b89]',
    surface: 'from-[#081a18] via-[#0d2b29] to-[#071512]',
    product: 'from-[#d6ffb0] via-[#7be29a] to-[#35af8d]',
    decor: 'detail' as const,
  },
  {
    id: 'brand',
    accent: 'from-[#ffd9f3] via-[#e49cff] to-[#8f63ff]',
    surface: 'from-[#1d1223] via-[#32193e] to-[#140a1c]',
    product: 'from-[#ffe2ef] via-[#f2b6ff] to-[#ac78ff]',
    decor: 'brand' as const,
  },
  {
    id: 'specs',
    accent: 'from-[#d8dcff] via-[#97b3ff] to-[#5f77ff]',
    surface: 'from-[#0d1532] via-[#142455] to-[#09112b]',
    product: 'from-[#f1f3ff] via-[#b3c9ff] to-[#6e8cff]',
    decor: 'specs' as const,
  },
] as const;

const WORKFLOW_STEPS = [
  '上传产品图并分析包装信息',
  '调整 AI 提取的产品卖点与风格',
  '生成海报并下载素材',
];

type FallbackBannerSlide = (typeof FALLBACK_BANNER_SLIDES)[number];

function FallbackBannerCard({
  slide,
  variant,
}: {
  slide: FallbackBannerSlide;
  variant: 'original' | 'designed';
}) {
  const slideDecor = {
    hero: (
      <>
        <div className="absolute right-[12.5%] top-[20%] h-[8%] w-[9%] rounded-full bg-white/20" />
        <div className="absolute right-[12.5%] bottom-[15%] h-[1px] w-[18%] bg-white/24" />
        <div className="absolute right-[12.5%] bottom-[11%] h-[1px] w-[13%] bg-white/18" />
      </>
    ),
    life: (
      <>
        <div className="absolute left-[24%] top-[24%] h-[12%] w-[8%] rounded-full bg-white/10 blur-md" />
        <div className="absolute left-[18%] bottom-[23%] h-[8%] w-[14%] rounded-full bg-[#fff4d2]/14" />
        <div className="absolute right-[11%] top-[72%] h-[7%] w-[20%] rounded-[1rem] bg-white/10" />
      </>
    ),
    process: (
      <>
        <div className="absolute right-[10.5%] top-[18%] h-[24%] w-[26%] rounded-full border border-white/14" />
        <div className="absolute right-[13.5%] top-[21%] h-[18%] w-[20%] rounded-full border border-white/10" />
        <div className="absolute right-[18%] top-[47%] h-[1px] w-[16%] bg-white/24" />
        <div className="absolute right-[16%] top-[54%] h-[1px] w-[12%] bg-white/18" />
      </>
    ),
    detail: (
      <>
        <div className="absolute left-[16%] top-[33%] h-[10%] w-[10%] rounded-full border border-white/18" />
        <div className="absolute left-[19%] top-[36%] h-[4%] w-[4%] rounded-full bg-white/20" />
        <div className="absolute right-[15%] top-[28%] h-[30%] w-[16%] rounded-[2rem] border border-white/10 bg-white/6 blur-[1px]" />
      </>
    ),
    brand: (
      <>
        <div className="absolute left-[11%] top-[18%] h-[1px] w-[16%] bg-white/24" />
        <div className="absolute left-[11%] top-[22%] h-[1px] w-[10%] bg-white/14" />
        <div className="absolute right-[13%] top-[15%] h-[22%] w-[12%] rounded-full bg-white/10 blur-xl" />
        <div className="absolute right-[11%] bottom-[14%] h-[8%] w-[21%] rounded-[1rem] bg-black/16" />
      </>
    ),
    specs: (
      <>
        <div className="absolute right-[12.5%] top-[18%] grid w-[18%] grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-10 rounded-[0.8rem] border border-white/12 bg-white/8"
            />
          ))}
        </div>
        <div className="absolute right-[12.5%] bottom-[16%] h-[1px] w-[20%] bg-white/22" />
        <div className="absolute right-[12.5%] bottom-[12%] h-[1px] w-[16%] bg-white/16" />
      </>
    ),
  }[slide.decor];

  const photoShapeClass = {
    hero: 'rounded-[1.5rem]',
    life: 'rounded-[2rem] rotate-[-3deg]',
    process: 'rounded-[1.5rem]',
    detail: 'rounded-[2rem]',
    brand: 'rounded-[1.8rem]',
    specs: 'rounded-[1.5rem]',
  }[slide.decor];

  const posterShadowClass = {
    hero: 'shadow-[0_32px_68px_rgba(4,8,24,0.34)]',
    life: 'shadow-[0_32px_68px_rgba(28,10,8,0.28)]',
    process: 'shadow-[0_32px_68px_rgba(4,18,44,0.34)]',
    detail: 'shadow-[0_32px_68px_rgba(0,24,20,0.3)]',
    brand: 'shadow-[0_32px_68px_rgba(28,8,38,0.32)]',
    specs: 'shadow-[0_32px_68px_rgba(10,20,48,0.34)]',
  }[slide.decor];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#060b18]">
      {variant === 'original' ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.surface} opacity-95`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.12),transparent_20%),radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,rgba(6,11,24,0.12),rgba(6,11,24,0.68))]" />
          <div className="absolute inset-[12%] rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(10,14,24,0.8),rgba(8,12,21,0.94))] shadow-[0_18px_42px_rgba(2,6,20,0.34)]" />
          <div className="absolute left-[14%] top-[16%] h-[6%] w-[18%] rounded-full bg-white/12" />
          <div
            className={`absolute left-[18%] top-[28%] h-[46%] w-[64%] border border-white/10 bg-[linear-gradient(180deg,rgba(235,240,255,0.14),rgba(195,203,235,0.04))] ${photoShapeClass}`}
          />
          <div
            className={`absolute left-[33%] top-[38%] h-[24%] w-[34%] rounded-[1rem] border border-white/16 bg-gradient-to-b ${slide.product} shadow-[0_14px_28px_rgba(8,10,24,0.24)]`}
          />
          <div className="absolute inset-x-[24%] bottom-[12%] h-[6%] rounded-full bg-black/18 blur-2xl" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent} opacity-85`} />
          <div className={`absolute inset-0 bg-gradient-to-tr ${slide.surface} opacity-72`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.12),transparent_18%),linear-gradient(145deg,rgba(6,11,24,0.18),rgba(6,11,24,0.7))]" />
          <div
            className={`absolute inset-x-[10%] top-[8%] bottom-[8%] overflow-hidden rounded-[1.8rem] border border-white/14 bg-[linear-gradient(180deg,rgba(18,24,45,0.22),rgba(8,12,22,0.42))] ${posterShadowClass}`}
          />
          <div className={`absolute inset-x-[10%] top-[8%] bottom-[8%] bg-gradient-to-br ${slide.accent} opacity-65`} />
          <div className="absolute left-[16%] top-[12%] h-[6%] w-[28%] rounded-full bg-white/18" />
          <div className="absolute left-[18%] top-[24%] h-[54%] w-[58%] rounded-[1.8rem] border border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))] shadow-[0_20px_36px_rgba(6,10,24,0.3)]" />
          <div
            className={`absolute left-[34%] top-[36%] h-[22%] w-[26%] rounded-[1rem] border border-white/16 bg-gradient-to-b ${slide.product}`}
          />
          <div className="absolute left-[16%] bottom-[16%] h-[3.6%] w-[30%] rounded-full bg-black/20" />
          <div className="absolute inset-x-[16%] bottom-[10%] h-[7%] rounded-full bg-black/18 blur-2xl" />
          {slideDecor}
        </>
      )}
    </div>
  );
}

function BannerImageCard({
  src,
  variant,
}: {
  src: string;
  variant: 'original' | 'designed';
}) {
  const isOriginal = variant === 'original';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,rgba(13,20,38,0.9),rgba(7,12,24,0.98))]">
      {isOriginal ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,rgba(8,12,22,0.92),rgba(5,9,18,0.98))]" />
          <div className="absolute inset-[6%] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(248,248,250,0.96),rgba(228,231,236,0.92))] shadow-[0_24px_44px_rgba(2,6,20,0.28)]" />
          <div className="absolute inset-[11%] flex items-center justify-center">
            <div className="relative h-full max-h-[42%] w-full max-w-[70%]">
              <Image
                src={src}
                alt=""
                fill
                priority
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,rgba(8,12,22,0.94),rgba(6,10,18,0.98))]" />
          <div className="absolute inset-[6%] rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_24px_52px_rgba(2,6,20,0.3)]" />
          <div className="absolute inset-[9%] flex items-center justify-center">
            <div className="relative h-full w-full">
              <Image
                src={src}
                alt=""
                fill
                priority
                unoptimized
                className="object-contain object-center"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ComparisonPanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-0 overflow-hidden bg-[#091121]">
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-white/12 bg-black/35 px-3 py-1.5 text-[11px] font-semibold tracking-[0.24em] text-white/92 backdrop-blur-md md:left-5 md:top-5">
        {label}
      </div>
      {children}
    </div>
  );
}

function BannerStage({
  bannerGroup,
  fallbackSlide,
}: {
  bannerGroup?: BannerGroup;
  fallbackSlide?: FallbackBannerSlide;
}) {
  return (
    <div className="h-full overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,38,0.88),rgba(7,12,24,0.96))] shadow-[0_24px_60px_rgba(2,6,20,0.4)]">
      <div className="grid h-full gap-px bg-white/10 md:grid-cols-2">
        {bannerGroup ? (
          <>
            <ComparisonPanel label="原图">
              <BannerImageCard src={bannerGroup.original} variant="original" />
            </ComparisonPanel>
            <ComparisonPanel label="设计图">
              <BannerImageCard src={bannerGroup.designed} variant="designed" />
            </ComparisonPanel>
          </>
        ) : fallbackSlide ? (
          <>
            <ComparisonPanel label="原图">
              <FallbackBannerCard slide={fallbackSlide} variant="original" />
            </ComparisonPanel>
            <ComparisonPanel label="设计图">
              <FallbackBannerCard slide={fallbackSlide} variant="designed" />
            </ComparisonPanel>
          </>
        ) : (
          <>
            <ComparisonPanel label="原图">
              <div className="h-full w-full bg-[#091121]" />
            </ComparisonPanel>
            <ComparisonPanel label="设计图">
              <div className="h-full w-full bg-[#091121]" />
            </ComparisonPanel>
          </>
        )}
      </div>
    </div>
  );
}

function PreviewStage({
  imagePreview,
}: {
  imagePreview: string;
}) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,38,0.88),rgba(7,12,24,0.96))] shadow-[0_24px_60px_rgba(2,6,20,0.4)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(95,119,255,0.16),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(194,72,255,0.14),transparent_22%)]" />
      <div className="relative w-full max-w-[480px] px-6 py-8">
        <div className="absolute inset-x-[18%] bottom-10 h-12 rounded-full bg-black/26 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-black/10 p-3 shadow-[0_28px_60px_rgba(5,10,24,0.42)]">
          <Image
            src={imagePreview}
            alt="当前上传的产品图"
            width={960}
            height={1440}
            unoptimized
            className="h-[58vh] min-h-[420px] max-h-[720px] w-full rounded-[1.45rem] object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { uploadedImage, setUploadedImage } = useAppContext();
  const [bannerIndex, setBannerIndex] = useState(0);
  const imagePreview = uploadedImage?.preview || '';

  const hasUploadedBannerGroups = HOME_BANNER_GROUPS.length > 0;
  const bannerCount = hasUploadedBannerGroups
    ? HOME_BANNER_GROUPS.length
    : FALLBACK_BANNER_SLIDES.length;

  const safeBannerIndex = bannerCount > 0 ? bannerIndex % bannerCount : 0;

  const currentBannerGroup = hasUploadedBannerGroups
    ? HOME_BANNER_GROUPS[safeBannerIndex]
    : undefined;
  const currentFallbackSlide = hasUploadedBannerGroups
    ? undefined
    : FALLBACK_BANNER_SLIDES[safeBannerIndex];

  useEffect(() => {
    if (imagePreview || bannerCount <= 1) return;
    const timer = window.setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerCount);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [imagePreview, bannerCount]);

  useEffect(() => {
    if (uploadedImage) return;
    const restored = restoreUploadedImageFromCache();
    if (restored) {
      setUploadedImage(restored);
    }
  }, [setUploadedImage, uploadedImage]);

  const handleUpload = (file: File, preview: string) => {
    const nextUploadedImage = {
      id: Date.now().toString(),
      file,
      preview,
      url: preview,
    };
    setUploadedImage(nextUploadedImage);
    persistUploadedImageCache(nextUploadedImage);
  };

  const handleAnalyze = () => {
    if (imagePreview) {
      router.push('/analyze');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 xl:h-[calc(100vh-11.5rem)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:grid xl:h-full xl:grid-rows-[minmax(0,1fr)_auto] xl:gap-5 xl:space-y-0">
          <ImageUpload
            onUpload={handleUpload}
            image={imagePreview}
            className="xl:h-full xl:aspect-auto"
          />

          <Card className="studio-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide">流程概览</h3>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {WORKFLOW_STEPS.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={!imagePreview}
                className="w-full"
              >
                开始分析
              </Button>
            </div>
          </Card>
        </aside>

        <section className="xl:h-full">
          <Card className="studio-panel h-full overflow-hidden p-5 lg:p-6">
            {imagePreview ? (
              <PreviewStage imagePreview={imagePreview} />
            ) : (
              <BannerStage
                bannerGroup={currentBannerGroup}
                fallbackSlide={currentFallbackSlide}
              />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
