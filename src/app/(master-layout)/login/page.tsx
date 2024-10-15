import LoadingSpinner from "@/components/loading-spinner";
import Script from "next/script";

export default async function LoginRedirect() {
  return (
    <>
      <LoadingSpinner />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function(){
              window.location.href = "/";
            }, 50);
          `,
        }}
      />
    </>
  );
}
