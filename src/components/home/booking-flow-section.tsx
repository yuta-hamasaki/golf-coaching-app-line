const steps = [
  {
    step: "01",
    title: "LINEでログイン",
    description: "LINEアカウントでかんたんログイン。初回は自動登録されます。",
  },
  {
    step: "02",
    title: "レッスンを選択",
    description: "目的や時間に合わせて、レッスンプランと空き枠を選びます。",
  },
  {
    step: "03",
    title: "オンライン決済",
    description: "Stripeで安全に決済。予約確定後、LINEで確認通知が届きます。",
  },
  {
    step: "04",
    title: "レッスン当日",
    description: "予約時間にコーチと合流。スイング改善を楽しみましょう。",
  },
];

export function BookingFlowSection() {
  return (
    <section className="bg-emerald-50/60 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-600">
            Flow
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-950 sm:text-3xl">
            予約までの流れ
          </h2>
          <p className="mt-3 text-emerald-800/80">
            4ステップで、今日からレッスン予約が可能です
          </p>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <span className="text-sm font-bold text-emerald-500">{item.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-emerald-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-800/75">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
