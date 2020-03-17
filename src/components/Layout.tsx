import { FunctionComponent } from "react";
import { bootstrappy } from './styles'

export const Layout: FunctionComponent = ({ children }) => (
  <div className='container'>
    {children}
    <style jsx global>{`
    body {
      font-family: Helvetica Neue,Helvetica,Arial,sans-serif;
      font-size: 14px;
      line-height: 1.42857143;
      padding: 0;
      margin: 0;
    }
    body * {
      box-sizing: border-box;
    }
    `}</style>
    <style jsx global>{bootstrappy}</style>
    <style jsx>{`
    .container {
      margin: 0 auto;
      width: 900px;
    }
    @media only screen and (max-width: 920px) {
      .container {
        width: 100%;
        padding-left: 20px;
        padding-right: 20px;
      }
    }
    `}</style>
  </div>
)
