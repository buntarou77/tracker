const prepareBarData = (data, labelData)=>{
    // console.log(data)
    // console.log(labelData)
    return {
        labels: labelData,
            datasets: [
                {
                label: 'Gains',
                data: data,
                backgroundColor: [
                    'rgba(220, 20, 60, 0.2)',
                    'rgba(7, 26, 22, 0.2)',
                    'rgba(60, 180, 200, 0.2)',
                    'rgba(140, 100, 60, 0.2)',
                    'rgba(240, 140, 20, 0.2)',
                    'rgba(120, 60, 180, 0.2)',
                    'rgba(180, 200, 60, 0.2)',
                    'rgba(100, 140, 240, 0.2)',
                    'rgba(200, 60, 140, 0.2)',
                    'rgba(140, 220, 100, 0.2)',
                    'rgba(60, 100, 240, 0.2)',
                    'rgba(240, 200, 140, 0.2)'
                ],
                borderColor: [
                    'rgb(220, 20, 60)',
                    'rgb(30, 140, 120)',
                    'rgb(60, 180, 200)',
                    'rgb(140, 100, 60)',
                    'rgb(240, 140, 20)',
                    'rgb(120, 60, 180)',
                    'rgb(180, 200, 60)',
                    'rgb(100, 140, 240)',
                    'rgb(200, 60, 140)',
                    'rgb(140, 220, 100)',
                    'rgb(60, 100, 240)',
                    'rgb(240, 200, 140)'
                ],
                borderWidth: 1
                }
            ]
}
}
const prepareLineData = (data, labels)=>{
    
    return{
            data: {
            labels: labels,
            datasets: [
                {
                label: 'gains',
                data: data[0],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
                fill: false
                },
                {
                label: 'losses',
                data: data[1],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.3,
                fill: false
                }
            ]
            },
            options:{
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'losses and gains', position: 'top' as const }
        },
        scales: {
            y: {
            beginAtZero: true
            }
        }
            }
        }

    
}
const preparePieData = (data, labels)=>{
    return{
        labels: [labels[0], labels[1]],
            datasets: [
                {
                label: 'gains',
                data: [data[0],data[1]],
                backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
                hoverOffset: 4
                }
            ]
    }

}
const prepareDoughnutData =(data, labels)=>{
    return{
         labels: labels,
      datasets: [
        {
          label: 'Расходы',
          data: data,
          backgroundColor: ['#FF6384', 
            '#36A2EB', 
            '#FFCE56', 
            '#4BC0C0', 
            '#9966FF', 
            '#FF9F40', 
            '#C9CBCF', 
            '#FF6B6B', 
            '#6BFFB3', 
            '#8470FF', 
            '#FFD700',  
            '#40E0D0', 
            '#FA8072', 
            '#B0E0E6', 
            '#FFB6C1',
            '#00CED1', 
            '#87CEFA', 
            '#20B2AA', 
            '#D2691E'  
            ],
          hoverOffset: 10
        }
      ]
    }
}
export {prepareBarData, prepareLineData, preparePieData, prepareDoughnutData}