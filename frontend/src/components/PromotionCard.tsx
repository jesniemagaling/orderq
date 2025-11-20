type PromotionCardProps = {
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
};

export default function PromotionCard({
  title,
  highlight,
  subtitle,
  image,
}: PromotionCardProps) {
  return (
    <div className="flex items-center max-w-[380px] gap-3 justify-between rounded-2xl bg-gradient-to-r from-[rgba(130,13,23,0.9)] to-[rgba(183,30,43,1)] p-4 text-white shadow-lg">
      <div className="ml-2">
        <p className="font-normal heading-3 opacity-90">{title}</p>
        <h3 className="font-semibold sm:text-lg tex-base">{highlight}</h3>
        <p className="font-normal heading-4">{subtitle}</p>
      </div>

      <div className="flex-shrink-0 sm:w-[108px] w-[90px] h-[84px] sm:h-[100px]">
        <img
          src={image}
          alt={highlight}
          className="object-cover w-full h-full rounded-2xl"
        />
      </div>
    </div>
  );
}
