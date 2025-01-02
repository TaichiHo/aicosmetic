import Social from "@/components/social";

export default function () {
  return (
    <section>
      <div className="w-screen flex-col px-6 py-20 lg:flex lg:px-10 xl:px-24">
        <div className="lg:flex lg:flex-row lg:justify-between">
          <div>
            <p>BeautyTracker</p>
            <p className="font-inter mt-4 max-w-[350px] text-base font-light text-gray-500">
              Your AI-powered cosmetics collection organizer
            </p>
            <div className="mb-8 mt-6">{/* <Social /> */}</div>
          </div>
          <div className="flex grow flex-row flex-wrap lg:mx-10 lg:flex-nowrap lg:justify-center">
            <div className="my-5 mr-8 flex max-w-[200px] grow basis-[100px] flex-col space-y-5 lg:mx-10 lg:mt-0">
              <p className="font-inter font-medium text-black">Features</p>
              <a
                href="/collection"
                className="font-inter font-light text-gray-500"
              >
                My Collection
              </a>
              <a
                href="/discover"
                className="font-inter font-light text-gray-500"
              >
                Discover
              </a>
              <a
                href="/scan"
                className="font-inter font-light text-gray-500"
              >
                Scan Product
              </a>
            </div>
            <div className="my-5 mr-8 flex max-w-[200px] grow basis-[100px] flex-col space-y-5 lg:mx-10 lg:mt-0">
              <p className="font-inter font-medium text-black">友情链接</p>
              <a
                href="https://aiwallpaper.shop"
                target="_blank"
                className="font-inter font-light text-gray-500"
              >
                AI Wallpaper
              </a>
            </div>
          </div>
          <div className="mt-10 flex flex-col lg:mt-0">
            <div className="mb-4 flex flex-row items-center">
              <p className="block">联系作者: </p>
              <p className="font-inter ml-4 text-black">me@idoubi.cc</p>
            </div>
          </div>
        </div>
        <div className="mx-auto my-12 w-full border border-[#E4E4E7] lg:my-20"></div>
        <div>
          <p className="font-inter text-center text-sm text-gray-500 lg:mt-0">
            © Copyright 2024.{" "}
            <a
              href="/"
              target="_blank"
              className="text-primary hidden md:inline-block"
            >
              beautytracker.app
            </a>{" "}
            All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}
