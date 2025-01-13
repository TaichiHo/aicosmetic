import { AppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Nav } from "@/types/nav";
import Social from "@/components/social";
import User from "@/components/user";
import { useContext } from "react";

export default function () {
  const { user } = useContext(AppContext);

  const navigations: Nav[] = [
    { name: "collection", title: "My Collection", url: "/collection", target: "_self" },
    { name: "discover", title: "Discover", url: "/discover", target: "_self" },
    { name: "routines", title: "Routines", url: "/routines", target: "_self" },
  ];

  return (
    <header>
      <div className="h-auto w-screen">
        <nav className="font-inter mx-auto h-auto w-full max-w-[1600px] lg:relative lg:top-0">
          <div className="flex flex-row items-center px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-8 xl:px-20">
            <a href="/" className="text-xl font-medium flex items-center">
              <img
                src="/logo.png"
                className="w-8 h-8 rounded-full mr-2"
                alt="logo"
              />
              <span className="font-bold text-primary text-2xl">
                BeautyTracker
              </span>
            </a>

            <div className="hidden md:flex ml-16">
              {navigations.map((tab: Nav, idx: number) => (
                <a
                  className="text-md font-normal leading-6 text-gray-800 mx-4"
                  key={idx}
                  href={tab.url}
                  target={tab.target}
                >
                  {tab.title}
                </a>
              ))}
            </div>

            <div className="flex-1"></div>

            <div className="flex flex-row items-center lg:flex lg:flex-row lg:space-x-3 lg:space-y-0">
              <div className="hidden md:block mr-4">{/* <Social /> */}</div>

              {user === undefined ? (
                <>loading...</>
              ) : (
                <>
                  {user ? (
                    <>
                      {user.credits && (
                        <a
                          href="/collection"
                          className="hidden md:block mr-8 font-normal text-gray-800 cursor-pointer"
                        >
                          Products:{" "}
                          <span className="text-primary">
                            {user.credits.left_credits}
                          </span>
                        </a>
                      )}

                      <User user={user} />
                    </>
                  ) : (
                    <a className="cursor-pointer" href="/sign-in">
                      <Button>login</Button>
                    </a>
                  )}
                </>
              )}
            </div>
            <a href="#" className="absolute right-5 lg:hidden"></a>
          </div>
        </nav>
      </div>
    </header>
  );
}
