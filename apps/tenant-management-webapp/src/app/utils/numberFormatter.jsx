

const numberFormatter = (number) => {
  if (number > 1000000){
    return ((number/1000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "M");
  }
  return(number.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
}

export default numberFormatter;
