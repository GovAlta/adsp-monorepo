import {
  GoabAppFooter,
  GoabAppHeader,
  GoabButton,
  GoabCallout,
  GoabContainer,
  GoabOneColumnLayout,
  GoabPageBlock,
} from '@abgov/react-components';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormComponent } from '../components/FormComponent';
import { adspFormConfig } from '../config/adspForm';
import {
  type AdspFormDefinition,
  type AdspSubmissionReceipt,
  loadAdspFormDefinition,
  submitAdspForm,
} from '../lib/adspFormApi';

export default function Apply() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [definition, setDefinition] = useState<AdspFormDefinition | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<unknown[]>([]);
  const [submission, setSubmission] = useState<AdspSubmissionReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const resolved = await loadAdspFormDefinition(adspFormConfig);
        if (active) {
          setDefinition(resolved);
        }
      } catch (err) {
        if (active) {
          setErrorMessage(err instanceof Error ? err.message : 'Unable to load form definition.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const hasValidationError = useMemo(() => errors.length > 0, [errors]);

  return (
    <GoabOneColumnLayout>
      <section slot="header" className="app-header-shell">
        <GoabAppHeader url="/" heading={adspFormConfig.serviceName}>
          <Link to="/apply" style={{ textDecoration: 'none', color: 'inherit' }}>
            Apply
          </Link>
          <Link to="/components" style={{ textDecoration: 'none', color: 'inherit' }}>
            Components
          </Link>
          <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
            About
          </Link>
        </GoabAppHeader>
      </section>

      <GoabPageBlock width="704px">
        <div className="page-content apply-page">
          <h1 className="page-title">Apply for this service</h1>
          <p className="lead-text">{adspFormConfig.serviceDescription}</p>

          <section className="section-spacing">
            <GoabContainer accent="thin">
              <h2 className="section-title">Application details</h2>
              <p>
                This starter includes a configurable ADSP form integration. Update
                src/config/adspForm.ts to connect a real tenant endpoint and definition.
              </p>
              <p>
                Current mode: <strong>{adspFormConfig.mode}</strong>
              </p>
            </GoabContainer>
          </section>

          {errorMessage ? (
            <section className="section-spacing">
              <GoabCallout type="important" heading="Form unavailable">
                {errorMessage}
              </GoabCallout>
            </section>
          ) : null}

          {loading ? (
            <section className="section-spacing">
              <GoabCallout type="information" heading="Loading form">
                Retrieving form definition...
              </GoabCallout>
            </section>
          ) : null}

          {!loading && definition && !submission ? (
            <section className="section-spacing form-shell">
              <h2 className="section-title">{definition.name}</h2>
              {definition.description ? <p>{definition.description}</p> : null}

              <FormComponent
                schema={definition.dataSchema}
                uischema={definition.uiSchema as never}
                data={data}
                validationMode="ValidateAndShow"
                onChange={({ data: updatedData, errors: nextErrors }) => {
                  setData((updatedData as Record<string, unknown>) || {});
                  setErrors((nextErrors as unknown[]) || []);
                }}
              />

              <div className="button-group">
                <GoabButton
                  type="submit"
                  disabled={hasValidationError || submitting}
                  onClick={async () => {
                    if (!definition) {
                      return;
                    }

                    try {
                      setSubmitting(true);
                      setErrorMessage(null);
                      const receipt = await submitAdspForm(adspFormConfig, definition.id, data);
                      setSubmission(receipt);
                    } catch (err) {
                      setErrorMessage(
                        err instanceof Error ? err.message : 'Unable to submit form.'
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit application'}
                </GoabButton>
              </div>
            </section>
          ) : null}

          {submission ? (
            <section className="section-spacing">
              <GoabCallout type="success" heading="Application submitted">
                <p>Your submission has been received.</p>
                <p className="submission-reference">Reference: {submission.id}</p>
                <GoabButton
                  type="tertiary"
                  onClick={() => {
                    setSubmission(null);
                    setData({});
                  }}
                >
                  Start another submission
                </GoabButton>
              </GoabCallout>
            </section>
          ) : null}
        </div>
      </GoabPageBlock>

      <section slot="footer">
        <GoabAppFooter></GoabAppFooter>
      </section>
    </GoabOneColumnLayout>
  );
}
