export const FeedbackCSSLeak = () => {
  return (
    <>
      <h1 className="title">Host application heading</h1>
      <p className="p-content">
        This sandbox content intentionally uses common elements and className names that also appear inside the feedback
        widget. Rendering the widget should not change this content.
      </p>
      <div className="overlay">Host container with an overlay className</div>
      <label className="radio-label" data-for="host-input">
        Host input label
      </label>
      <input id="host-input" className="radio" type="text" value="Host input" />
      <button className="adsp-fb-form-primary" type="button">
        Host button
      </button>
      <a href="#host-link">Host link</a>
      <p id="host-link" className="ratingText">
        Host rating text
      </p>
      <span className="tooltip-text">Host tooltip text</span>
      <img className="rating" alt="Host rating icon" />
    </>
  );
};
