"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import ConfigureAmplify from "./ConfigureAmplify";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      <ConfigureAmplify />
      {children}
    </Authenticator.Provider>
  );
}

