const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export default function AdminProductsLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="正在加载产品管理">
      <div className="animate-pulse">
        <div className="h-3 w-32 rounded bg-[#EAECF0]" />
        <div className="mt-4 h-8 w-40 rounded bg-[#E4E7EC]" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#F2F4F7]" />

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-24 rounded-xl border border-[#E4E7EC] bg-white p-4">
              <div className="h-3 w-20 rounded bg-[#EAECF0]" />
              <div className="mt-4 h-7 w-14 rounded bg-[#E4E7EC]" />
            </div>
          ))}
        </div>

        <div className="mt-5 h-20 rounded-xl border border-[#E4E7EC] bg-white" />
        <div className="mt-6 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {skeletonCards.map((index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
              <div className="aspect-[4/3] bg-[#F2F4F7]" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-24 rounded bg-[#EAECF0]" />
                <div className="h-5 w-3/4 rounded bg-[#E4E7EC]" />
                <div className="h-2 w-full rounded bg-[#F2F4F7]" />
                <div className="h-16 rounded-lg bg-[#F8FAFC]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
