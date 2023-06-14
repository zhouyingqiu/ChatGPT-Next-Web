"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  linkEl.rel = "stylesheet";
  linkEl.href =
    "/google-fonts/css2?family=Noto+Sans+SC:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function getCookie(key: string) {
  let re = new RegExp("s?" + key + "=([^;]+)(;|$)");
  if (document && document.cookie && re) {
    const matches = document.cookie.match(re);
    if (matches && matches.length > 1) {
      return matches[1];
    }
  }
  return "";
}

const fetchHasAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // setTimeout(() => {
    //   console.log('true')
    //   resolve(true);
    // }, 5000);
    fetch(
      `/aimaster/lqw3cNjxfdtU?phone_number=${getCookie(
        "phone_number",
      )}&key=${getCookie("key")}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
      },
    )
      .then((res) => {
        res.json().then((r) => {
          console.log("-------123----", r);
          if (r.status === 0) {
            resolve(true);
          } else {
            // 这里可以直接跳转到登录地址
            resolve(false);
          }
        });
      })
      .finally(() => {
        // console.log(123)
      });
  });
};

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();

  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    loadAsyncGoogleFont();
    async function fetchData() {
      try {
        const hasAuthValue = await fetchHasAuth(); // replace fetchHasAuth with your own asynchronous function to retrieve the value of hasAuth
        setHasAuth(hasAuthValue);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);
  // const hasAuth = await getAuth()
  if (!hasAuth) {
    return null;
  }

  return (
    <div
      className={
        styles.container +
        ` ${
          config.tightBorder && !isMobileScreen
            ? styles["tight-container"]
            : styles.container
        }`
      }
    >
      {isAuth ? (
        <>
          <AuthPage />
        </>
      ) : (
        <>
          <SideBar className={isHome ? styles["sidebar-show"] : ""} />

          <div className={styles["window-content"]} id={SlotID.AppBody}>
            <Routes>
              <Route key={"1"} path={Path.Home} element={<Chat />} />
              <Route key={"2"} path={Path.NewChat} element={<NewChat />} />
              <Route key={"3"} path={Path.Masks} element={<MaskPage />} />
              <Route key={"4"} path={Path.Chat} element={<Chat />} />
              <Route key={"5"} path={Path.Settings} element={<Settings />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}

export function Home() {
  useSwitchTheme();

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
