import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function dec(x: number) {
  return Math.round(x*10000)/10000;
}

function dec2(x: number) {
  return Math.round(x*100)/100;
}

export default function Model() {
    let { model } = useParams();

    const [gains, setGains] = useState(0.0);
    const [modelInfo, setmodelInfo] : [any,any]= useState({});
    const [simulationInfo, setSimulationInfo] : [any,any]= useState({});

    useEffect( () => {
        async function action() {
            let changed = false;
            const response = await fetch(`/api/simulation3?modelName=${model}`);
            const result = await response.json()
            console.log(result);
            setSimulationInfo(result.simulation);
            const modelResponse = await fetch(`/api/model/${model}`);
            const modelResult = await modelResponse.json()
            console.log(modelResult);
            setmodelInfo(modelResult.model);
            setGains(modelResult.model.gains1);
        }
        action().catch(console.error);
    }, []);

    return (
        <div>
            <b>Name</b> { model }
            <br />
            <b>Gains</b> {dec(gains)}
            <br />
            <b>Market interday</b> {dec(modelInfo.meanInterday)}
            <br />
            <b>Market daily</b> {dec(modelInfo.meanMarket)}
            <br />
            <b>#orders</b> {modelInfo.countValid} {dec2(100*modelInfo.countValid / modelInfo.countAll)}%
            <br />
            <b>#days</b> {modelInfo.nDates} {modelInfo.period_start}-{modelInfo.period_end}
            <br />
            <b>Real</b> {dec(simulationInfo.orderSameDaysGains)}
            <br />
            <b>Simulation</b> {dec(simulationInfo.simAllGains)} {dec2(100*simulationInfo.simSuccess)}%
            <br />
            <b>Real same symbols</b> {dec(simulationInfo.orderSameGains)}
            <br />
            <b>Simulation same symbols</b> {dec(simulationInfo.simSameGains)}
            <br />
            <b>Purchase</b> {dec(modelInfo.buy_update_price_factor)}
            <br />
        </div>
    )
}