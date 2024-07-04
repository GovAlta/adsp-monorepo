export function randomForm(context, _emitter, next) {
  if (context.vars.form_results) {
    const randomIndex = Math.round(Math.random() * (context.vars.form_results.length - 1));
    context.vars.form_id = context.vars.form_results[randomIndex].id;
  }
  next();
}
