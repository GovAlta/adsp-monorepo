import { GoabOneColumnLayout, GoabAppHeader, GoabAppFooter } from '@abgov/react-components';
import { Link } from 'react-router-dom';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoabOneColumnLayout>
      <section slot="header" className="app-header-shell">
        <GoabAppHeader
          url="/"
          heading="Alberta service"
          navigation={
            <>
              <Link to="/apply" style={{ textDecoration: 'none', color: 'inherit' }}>Apply</Link>
              <Link to="/components" style={{ textDecoration: 'none', color: 'inherit' }}>Components</Link>
              <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>About</Link>
            </>
          }
        />
      </section>
      {children}
      <section slot="footer">
        <GoabAppFooter />
      </section>
    </GoabOneColumnLayout>
  );
}
